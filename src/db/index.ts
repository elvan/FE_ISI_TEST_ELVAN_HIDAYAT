import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/todo_list';

// Create connection
const client = postgres(connectionString);

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

export type DbClient = typeof db;
