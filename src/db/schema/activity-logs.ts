import { pgTable, serial, varchar, timestamp, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { EntityType, LogAction } from '../../types';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { relations } from 'drizzle-orm';

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 20 }).$type<EntityType>().notNull(),
  entityId: integer('entity_id').notNull(),
  action: varchar('action', { length: 20 }).$type<LogAction>().notNull(),
  userId: integer('user_id').references(() => users.id).notNull(),
  details: jsonb('details').default({}).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
    relationName: 'log_created_by',
  }),
}));

// Zod schemas for validation
export const insertActivityLogSchema = createInsertSchema(activityLogs, {
  entityType: z.nativeEnum(EntityType),
  action: z.nativeEnum(LogAction),
  details: z.record(z.string(), z.any()).default({}),
});

export const selectActivityLogSchema = createSelectSchema(activityLogs);

// TypeScript types
export type ActivityLog = z.infer<typeof selectActivityLogSchema>;
export type NewActivityLog = z.infer<typeof insertActivityLogSchema>;
