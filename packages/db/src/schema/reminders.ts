import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { reminderChannelEnum, reminderStatusEnum } from './enums';
import { taskOccurrences } from './tasks';
import { users } from './users';

/**
 * A scheduled delivery on a single channel. `externalId` stores the provider's
 * id (e.g. an Alexa reminder id) so updates/deletes can be synced.
 */
export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskOccurrenceId: uuid('task_occurrence_id').references(() => taskOccurrences.id, {
    onDelete: 'cascade',
  }),
  channel: reminderChannelEnum('channel').notNull(),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  status: reminderStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  externalId: text('external_id'),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  ...timestamps,
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
