import {
  boolean,
  date,
  pgTable,
  text,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { softDelete, timestamps } from './_shared';
import { occurrenceStatusEnum, taskPriorityEnum, taskStatusEnum } from './enums';
import { categories } from './categories';
import { recurringRules } from './recurring';
import { users } from './users';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  status: taskStatusEnum('status').notNull().default('pending'),
  dueDate: date('due_date', { mode: 'string' }),
  reminderTime: time('reminder_time'),
  notes: text('notes'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringRuleId: uuid('recurring_rule_id').references(() => recurringRules.id, {
    onDelete: 'set null',
  }),
  telegramEnabled: boolean('telegram_enabled').notNull().default(false),
  alexaEnabled: boolean('alexa_enabled').notNull().default(false),
  ...timestamps,
  ...softDelete,
});

/** Materialized instances of a (possibly recurring) task. */
export const taskOccurrences = pgTable(
  'task_occurrences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    occurrenceDate: date('occurrence_date', { mode: 'string' }).notNull(),
    status: occurrenceStatusEnum('status').notNull().default('pending'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => ({
    uniqueOccurrence: unique('task_occurrences_task_date_uq').on(t.taskId, t.occurrenceDate),
  }),
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskOccurrence = typeof taskOccurrences.$inferSelect;
export type NewTaskOccurrence = typeof taskOccurrences.$inferInsert;
