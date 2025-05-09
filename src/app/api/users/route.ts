import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Only lead users can fetch the list of users
    if (session.user.role !== UserRole.LEAD) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleParam = searchParams.get('role');
    
    // Prepare filters
    const filters = [];
    
    // Filter by role if specified
    if (roleParam && Object.values(UserRole).includes(roleParam as UserRole)) {
      filters.push(eq(users.role, roleParam as UserRole));
    }

    // Build the query with conditions
    const query = db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(filters.length > 0 ? and(...filters) : undefined);

    const result = await query;

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Error fetching users' },
      { status: 500 }
    );
  }
}
