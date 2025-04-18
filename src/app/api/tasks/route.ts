import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { activityLogs } from '@/db/schema/activity-logs';
import { eq, and, desc, isNull, asc, or } from 'drizzle-orm';
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
    
    let query = db.select({
      tasks: tasks,
      createdBy: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      },
      assignedTo: {
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      }
    }).from(tasks)
      .leftJoin(users, eq(tasks.createdById, users.id))
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .orderBy(desc(tasks.createdAt));

    // Filter by user role
    if (session.user.role === UserRole.LEAD) {
      // Lead users see tasks they created
      query = query.where(eq(tasks.createdById, userId));
    } else {
      // Team members see tasks assigned to them
      query = query.where(eq(tasks.assignedToId, userId));
    }

    // Filter by status if specified
    if (statusParam && statusParam !== 'all' && Object.values(TaskStatus).includes(statusParam as TaskStatus)) {
      query = query.where(eq(tasks.status, statusParam as TaskStatus));
    }

    const result = await query;

    // Format the result
    const formattedTasks = result.map(item => ({
      ...item.tasks,
      createdBy: item.createdBy,
      assignedTo: item.assignedTo,
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
