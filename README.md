# To-Do List Application

A task management web application with role-based permissions (Lead and Team Member) built with Next.js, TypeScript, NextAuth.js, and Drizzle ORM with PostgreSQL.

## Features

- **User Authentication**: Secure login with JWT strategy
- **Role-Based Access Control**: Two user roles with different permissions:
  - **Lead**: Can create and modify tasks, assign tasks to team members
  - **Team Member**: Can update status and details of assigned tasks
- **Task Management**: Create, view, edit, and track tasks with 4 different statuses:
  - Not Started
  - In Progress
  - Done
  - Rejected
- **Activity Logging**: Comprehensive audit trail of all changes made to tasks
- **Responsive UI**: Fully responsive design built with TailwindCSS

## Tech Stack

- **Frontend**: Next.js, TypeScript, TailwindCSS, React Hook Form, Zod
- **State Management**: React Hooks, Context API
- **Backend**: Next.js API Routes
- **Authentication**: NextAuth.js with JWT
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Node.js (v18 or newer)
- npm or yarn
- Docker and Docker Compose for deployment

### Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/todo-list-app.git
cd todo-list-app
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your specific configuration.

4. Start the PostgreSQL database using Docker:

```bash
docker-compose up postgres -d
```

5. Generate database migrations and apply them:

```bash
npm run db:generate
npm run db:migrate
```

6. Seed the database with initial data:

```bash
npm run db:seed
```

7. Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

### Test Accounts

After running the seed script, you can use these accounts to test the application:

- **Lead User**: 
  - Email: lead@example.com
  - Password: password123

- **Team Member**:
  - Email: alice@example.com
  - Password: password123

## Docker Deployment

To deploy the application with Docker Compose:

```bash
docker-compose up -d
```

This will start both the Next.js application and PostgreSQL database in containers.

## Database Schema

### Users Table
- id (PK)
- name
- email
- password (hashed)
- role (enum: 'lead', 'team_member')
- createdAt
- updatedAt

### Tasks Table
- id (PK)
- title
- description
- status (enum: 'not_started', 'in_progress', 'done', 'rejected')
- createdById (FK to Users)
- assignedToId (FK to Users, nullable)
- dueDate (nullable)
- createdAt
- updatedAt

### ActivityLogs Table
- id (PK)
- entityType (e.g., 'task', 'user')
- entityId (the ID of the affected entity)
- action (e.g., 'created', 'updated', 'status_changed')
- userId (FK to Users, who performed the action)
- details (JSON field with before/after values)
- createdAt

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Authentication pages
│   │   ├── api/          # API routes
│   │   ├── dashboard/    # Dashboard pages
│   │   └── [...]
│   ├── components/       # Reusable UI components
│   ├── db/               # Database configuration & schema
│   ├── lib/              # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── auth/             # Authentication utilities
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker configuration
└── [...]
```

## License

MIT
