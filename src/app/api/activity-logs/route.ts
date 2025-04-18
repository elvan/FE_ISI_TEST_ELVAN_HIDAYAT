import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { activityLogs } from '@/db/schema/activity-logs';
import { users } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { EntityType, LogAction, UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const isLead = session.user.role === UserRole.LEAD;
    
    const { searchParams } = new URL(request.url);
    const entityTypeParam = searchParams.get('entityType');
    const actionParam = searchParams.get('action');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 100; // Default limit of 100 logs
    
    // Build query
    let query = db.select({
      log: activityLogs,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      }
    }).from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit); // Use the requested limit
    
    // Apply filters
    const filters = [];
    
    // Filter by user role
    if (!isLead) {
      // Team members only see logs related to their own actions or tasks assigned to them
      filters.push(eq(activityLogs.userId, userId));
    }
    
    // Filter by entity type if specified
    if (entityTypeParam && Object.values(EntityType).includes(entityTypeParam as EntityType)) {
      filters.push(eq(activityLogs.entityType, entityTypeParam as EntityType));
    }
    
    // Filter by action if specified
    if (actionParam && Object.values(LogAction).includes(actionParam as LogAction)) {
      filters.push(eq(activityLogs.action, actionParam as LogAction));
    }
    
    // Apply filters if any
    if (filters.length > 0) {
      query = query.where(and(...filters));
    }
    
    const result = await query;
    
    // Format the result
    const formattedLogs = result.map(item => ({
      ...item.log,
      user: item.user,
    }));
    
    return NextResponse.json({ logs: formattedLogs });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { message: 'Error fetching activity logs' },
      { status: 500 }
    );
  }
}
