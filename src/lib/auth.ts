import { UserRole } from '@/types';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function getUserByEmail(email: string) {
  try {
    // Add more debugging to identify issues
    console.log(`Looking up user with email: ${email}`);
    
    // Fix the query format for Drizzle with proper where clause
    const user = await db.query.users.findFirst({
      where: (users) => eq(users.email, email),
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function verifyPassword(plainPassword: string, hashedPassword: string) {
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export async function hashPassword(password: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    console.error('Error hashing password:', error);
    throw new Error('Failed to hash password');
  }
}

export function isUserLead(user: { role: string } | undefined | null): boolean {
  return user?.role === UserRole.LEAD;
}
