import { date, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { recurrenceFrequencyEnum } from './enums';
import { users } from './users';

/**
 * A recurrence definition shared by income, expenses, and tasks. For non-custom
 * frequencies, `interval` repeats the unit (e.g. every 2 weeks). For `custom`,
 * `cron` holds a cron-like expression. `nextRunAt` is advanced by the scheduler.
 */
export const recurringRules = pgTable('recurring_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  frequency: recurrenceFrequencyEnum('frequency').notNull(),
  interval: integer('interval').notNull().default(1),
  cron: text('cron'),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }),
  nextRunAt: timestamp('next_run_at', { withTimezone: true }),
  ...timestamps,
});

export type RecurringRule = typeof recurringRules.$inferSelect;
export type NewRecurringRule = typeof recurringRules.$inferInsert;
