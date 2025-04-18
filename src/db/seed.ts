import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, tasks } from './schema';
import { activityLogs } from './schema/activity-logs';
import { UserRole, TaskStatus, EntityType, LogAction } from '../types';
import { hashPassword } from '../lib/auth';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/todo_list';

async function main() {
  console.log('Seeding started...');
  
  // Create a new postgres client
  const client = postgres(connectionString);
  const db = drizzle(client);

  // Clear existing data first
  console.log('Clearing existing data...');
  await db.delete(activityLogs);
  await db.delete(tasks);
  await db.delete(users);

  console.log('Inserting seed data...');
  
  // Create test users
  const leadPassword = await hashPassword('password123');
  const memberPassword = await hashPassword('password123');
  
  // Insert lead user
  const [leadUser] = await db.insert(users).values({
    name: 'John Lead',
    email: 'lead@example.com',
    password: leadPassword,
    role: UserRole.LEAD,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();
  
  console.log('Created lead user:', leadUser.email);
  
  // Insert team members
  const teamMembers = await Promise.all([
    db.insert(users).values({
      name: 'Alice Member',
      email: 'alice@example.com',
      password: memberPassword,
      role: UserRole.TEAM_MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning(),
    db.insert(users).values({
      name: 'Bob Member',
      email: 'bob@example.com',
      password: memberPassword,
      role: UserRole.TEAM_MEMBER,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning(),
  ]);
  
  const aliceUser = teamMembers[0][0];
  const bobUser = teamMembers[1][0];
  
  console.log('Created team members:', aliceUser.email, bobUser.email);
  
  // Create some sample tasks
  const sampleTasks = [
    {
      title: 'Create project documentation',
      description: 'Write comprehensive documentation for the project including setup instructions and API endpoints.',
      status: TaskStatus.NOT_STARTED,
      createdById: leadUser.id,
      assignedToId: aliceUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Implement user authentication',
      description: 'Set up JWT authentication with role-based access control.',
      status: TaskStatus.IN_PROGRESS,
      createdById: leadUser.id,
      assignedToId: bobUser.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      title: 'Design database schema',
      description: 'Create database schema for users, tasks, and activity logs.',
      status: TaskStatus.DONE,
      createdById: leadUser.id,
      assignedToId: aliceUser.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(),
    },
    {
      title: 'Set up CI/CD pipeline',
      description: 'Configure GitHub Actions for continuous integration and deployment.',
      status: TaskStatus.NOT_STARTED,
      createdById: leadUser.id,
      assignedToId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  // Insert tasks
  for (const taskData of sampleTasks) {
    const [task] = await db.insert(tasks).values(taskData).returning();
    console.log('Created task:', task.title);
    
    // Add activity log for task creation
    await db.insert(activityLogs).values({
      entityType: EntityType.TASK,
      entityId: task.id,
      action: LogAction.CREATED,
      userId: leadUser.id,
      details: { title: task.title, assignedToId: task.assignedToId },
      createdAt: task.createdAt,
    });
    
    // If assigned, add assignment log
    if (task.assignedToId) {
      await db.insert(activityLogs).values({
        entityType: EntityType.TASK,
        entityId: task.id,
        action: LogAction.ASSIGNED,
        userId: leadUser.id,
        details: { assignedToId: task.assignedToId },
        createdAt: new Date(task.createdAt.getTime() + 1000), // 1 second after creation
      });
    }
  }
  
  console.log('Seed data inserted successfully!');
  
  // Release the connection
  await client.end();
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
