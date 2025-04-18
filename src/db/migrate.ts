import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

// Database connection string from environment or default for local development
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/todo_list';

async function main() {
  console.log('Migration started...');
  
  // Create a new postgres client
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log('Running migrations...');
  
  // This will run migrations from the "drizzle" folder
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('Migrations completed successfully!');
  
  // Release the connection
  await client.end();
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
