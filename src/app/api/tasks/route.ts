import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { activityLogs } from '@/db/schema/activity-logs';
import { eq, desc, and, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { TaskStatus, UserRole, EntityType, LogAction } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Prepare filters for the query
    const filters = [];

    // Filter by user role
    if (session.user.role === UserRole.LEAD) {
      // Lead users see tasks they created
      filters.push(eq(tasks.createdById, userId));
    } else {
      // Team members see tasks assigned to them
      filters.push(eq(tasks.assignedToId, userId));
    }

    // Filter by status if specified
    if (statusParam && statusParam !== 'all' && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      filters.push(eq(tasks.status, statusParam as TaskStatus));
    }

    // Build query with all conditions
    const query = db.select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      createdById: tasks.createdById,
      assignedToId: tasks.assignedToId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      dueDate: tasks.dueDate,
      creatorId: users.id,
      creatorName: users.name,
      creatorEmail: users.email,
      creatorRole: users.role,
    })
    .from(tasks)
    .leftJoin(users, eq(tasks.createdById, users.id))
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(tasks.createdAt))
    .limit(limit || 100); // Default limit of 100, or use the specified limit

    const result = await query;

    // Get all unique assignedToIds to fetch assignee info
    const assigneeIds = result
      .filter(task => task.assignedToId !== null)
      .map(task => task.assignedToId)
      // Filter out any potentially null values and ensure they're numbers
      .filter((id): id is number => id !== null);

    // Define the interface for assignee
    interface Assignee {
      id: number;
      name: string;
      email: string;
      role: UserRole;
    }

    // Only fetch assignees if there are any tasks with assignees
    let assignees: Assignee[] = [];
    if (assigneeIds.length > 0) {
      assignees = await db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(sql`${users.id} IN (${sql.join(assigneeIds, sql`, `)})`);
    }

    // Create a map of assignee info by id for quick lookup
    const assigneeMap: Record<number, Assignee> = {};
    for (const assignee of assignees) {
      assigneeMap[assignee.id] = assignee;
    }

    // Format the result
    const formattedTasks = result.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      status: item.status,
      createdById: item.createdById,
      assignedToId: item.assignedToId,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      dueDate: item.dueDate,
      createdBy: {
        id: item.creatorId,
        name: item.creatorName,
        email: item.creatorEmail,
        role: item.creatorRole,
      },
      assignedTo: item.assignedToId ? assigneeMap[item.assignedToId] || null : null,
    }));

    return NextResponse.json({ tasks: formattedTasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { message: 'Error fetching tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only lead users can create tasks
    if (session.user.role !== UserRole.LEAD) {
      return NextResponse.json({ message: 'Forbidden: Only leads can create tasks' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, assignedToId, dueDate } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json({ message: 'Task title is required' }, { status: 400 });
    }

    // If assignedToId is provided, check if the user exists and is a team member
    if (assignedToId) {
      const assignedUser = await db.query.users.findFirst({
        where: eq(users.id, assignedToId),
      });

      if (!assignedUser) {
        return NextResponse.json({ message: 'Assigned user not found' }, { status: 404 });
      }
    }

    // Create the task
    const [newTask] = await db.insert(tasks).values({
      title,
      description,
      status: TaskStatus.NOT_STARTED,
      createdById: session.user.id,
      assignedToId: assignedToId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Log the creation of the task
    await db.insert(activityLogs).values({
      entityType: EntityType.TASK,
      entityId: newTask.id,
      action: LogAction.CREATED,
      userId: session.user.id,
      details: { title, assignedToId },
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: 'Task created successfully',
      task: newTask
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { message: 'Error creating task' },
      { status: 500 }
    );
  }
}
