import { pgTable, serial, varchar, timestamp, text, integer } from 'drizzle-orm/pg-core';
import { TaskStatus } from '../../types';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).$type<TaskStatus>().default(TaskStatus.NOT_STARTED).notNull(),
  createdById: integer('created_by_id').references(() => users.id).notNull(),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define relations
export const tasksRelations = relations(tasks, ({ one }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
    relationName: 'task_created_by',
  }),
  assignedTo: one(users, {
    fields: [tasks.assignedToId],
    references: [users.id],
    relationName: 'task_assigned_to',
  }),
}));

// Zod schemas for validation
export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus),
  dueDate: z.date().optional(),
});

export const selectTaskSchema = createSelectSchema(tasks);

// TypeScript types
export type Task = z.infer<typeof selectTaskSchema>;
export type NewTask = z.infer<typeof insertTaskSchema>;
