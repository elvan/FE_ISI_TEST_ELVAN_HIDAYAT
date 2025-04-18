import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks } from '@/db/schema';
import { TaskStatus } from '@/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Initialize summary with zeros for all statuses
    const summary: Record<string, number> = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.DONE]: 0,
      [TaskStatus.REJECTED]: 0,
      total: 0,
    };

    // Based on user role, fetch either created tasks (for lead) or assigned tasks (for team member)
    const isLead = session.user.role === 'lead';
    
    // Get counts for each status
    const result = await db.execute(
      sql`
        SELECT status, COUNT(*) as count
        FROM ${tasks}
        WHERE ${isLead ? sql`created_by_id = ${userId}` : sql`assigned_to_id = ${userId}`}
        GROUP BY status
      `
    );

    // Debug the result structure
    console.log('Task summary result:', JSON.stringify(result, null, 2));

    // Process the results - Drizzle returns an array directly, not a rows property
    let total = 0;
    // The result is the array directly
    for (const row of result) {
      const status = row.status as string;
      const count = Number(row.count);
      
      if (status in summary) {
        summary[status] = count;
        total += count;
      }
    }
    
    summary.total = total;

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Error fetching task summary:', error);
    return NextResponse.json(
      { message: 'Error fetching task summary' },
      { status: 500 }
    );
  }
}
