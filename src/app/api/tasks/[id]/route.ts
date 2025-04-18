import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users } from '@/db/schema';
import { activityLogs } from '@/db/schema/activity-logs';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { TaskStatus, UserRole, EntityType, LogAction } from '@/types';

// GET a single task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ message: 'Invalid task ID' }, { status: 400 });
    }

    // Get the task with creator info
    const task = await db
      .select({
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
      .where(eq(tasks.id, taskId))
      .then(rows => rows[0]);
    
    if (!task) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }
    
    // Get assignee info if task has an assignee
    let assignee = null;
    if (task.assignedToId) {
      assignee = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, task.assignedToId))
        .then(rows => rows[0] || null);
    }

    // NOTE: We already checked if task exists above

    // Check if user has access to this task
    const userId = session.user.id;
    const isLead = session.user.role === UserRole.LEAD;

    // Lead can access tasks they created, team members can only access assigned tasks
    if (
      !isLead && 
      task.assignedToId !== userId
    ) {
      return NextResponse.json(
        { message: 'You do not have permission to view this task' },
        { status: 403 }
      );
    }

    // Format the response
    const formattedTask = {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      createdById: task.createdById,
      assignedToId: task.assignedToId,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      dueDate: task.dueDate,
      createdBy: {
        id: task.creatorId,
        name: task.creatorName,
        email: task.creatorEmail,
        role: task.creatorRole,
      },
      assignedTo: assignee,
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { message: 'Error fetching task details' },
      { status: 500 }
    );
  }
}

// PATCH to update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ message: 'Invalid task ID' }, { status: 400 });
    }

    // Get the existing task
    const existingTask = await db.query.tasks.findFirst({
      where: eq(tasks.id, taskId),
    });

    if (!existingTask) {
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });
    }

    // Check permissions based on role
    const userId = session.user.id;
    const isLead = session.user.role === UserRole.LEAD;

    if (!isLead && existingTask.assignedToId !== userId) {
      return NextResponse.json(
        { message: 'You do not have permission to update this task' },
        { status: 403 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { title, description, status, assignedToId, dueDate } = body;

    // Create an object to hold the updates
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    let logAction = LogAction.UPDATED;
    const logDetails: Record<string, unknown> = {};

    // Team members can only update status
    if (!isLead) {
      // Team members can only update status
      if (status && Object.values(TaskStatus).includes(status)) {
        updates.status = status;
        logAction = LogAction.STATUS_CHANGED;
        logDetails.previousStatus = existingTask.status;
        logDetails.newStatus = status;
      } else if (status) {
        return NextResponse.json({ message: 'Invalid status value' }, { status: 400 });
      }
    } else {
      // Lead users can update all fields
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (status && Object.values(TaskStatus).includes(status)) {
        updates.status = status;
        if (status !== existingTask.status) {
          logAction = LogAction.STATUS_CHANGED;
          logDetails.previousStatus = existingTask.status;
          logDetails.newStatus = status;
        }
      }
      if (assignedToId !== undefined) {
        // Check if assignedToId is a valid user (if provided)
        if (assignedToId !== null) {
          const assignedUser = await db.query.users.findFirst({
            where: eq(users.id, assignedToId),
          });
          if (!assignedUser) {
            return NextResponse.json(
              { message: 'Assigned user not found' },
              { status: 404 }
            );
          }
          // Check if user has team_member role
          if (assignedUser.role !== UserRole.TEAM_MEMBER) {
            return NextResponse.json(
              { message: 'Only team members can be assigned to tasks' },
              { status: 400 }
            );
          }
        }
        
        updates.assignedToId = assignedToId;
        
        // If assignment changed, log it specifically
        if (assignedToId !== existingTask.assignedToId) {
          logAction = LogAction.ASSIGNED;
          logDetails.previousAssignee = existingTask.assignedToId;
          logDetails.newAssignee = assignedToId;
        }
      }
      if (dueDate !== undefined) {
        updates.dueDate = dueDate ? new Date(dueDate) : null;
      }
    }

    // If no valid updates were provided
    if (Object.keys(updates).length <= 1) { // 1 because updatedAt is always included
      return NextResponse.json(
        { message: 'No valid updates provided' },
        { status: 400 }
      );
    }

    // Update the task
    const [updatedTask] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, taskId))
      .returning();

    // Log the update
    await db.insert(activityLogs).values({
      entityType: EntityType.TASK,
      entityId: taskId,
      action: logAction,
      userId: session.user.id,
      details: logDetails,
      createdAt: new Date(),
    });

    // Get the updated task with creator info
    const taskWithCreator = await db
      .select({
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
      .where(eq(tasks.id, taskId))
      .then(rows => rows[0]);
    
    // Get assignee info if task has an assignee
    let assignee = null;
    if (updatedTask.assignedToId !== null && updatedTask.assignedToId !== undefined) {
      assignee = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, updatedTask.assignedToId as number))
        .then(rows => rows[0] || null);
    }

    // Format the response
    const formattedTask = {
      id: taskWithCreator.id,
      title: taskWithCreator.title,
      description: taskWithCreator.description,
      status: taskWithCreator.status,
      createdById: taskWithCreator.createdById,
      assignedToId: taskWithCreator.assignedToId,
      createdAt: taskWithCreator.createdAt,
      updatedAt: taskWithCreator.updatedAt,
      dueDate: taskWithCreator.dueDate,
      createdBy: {
        id: taskWithCreator.creatorId,
        name: taskWithCreator.creatorName,
        email: taskWithCreator.creatorEmail,
        role: taskWithCreator.creatorRole,
      },
      assignedTo: assignee,
    };

    return NextResponse.json({ 
      message: 'Task updated successfully',
      task: formattedTask 
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { message: 'Error updating task' },
      { status: 500 }
    );
  }
}
