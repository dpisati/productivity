import { jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { notificationTypeEnum } from './enums';
import { users } from './users';

/** In-app notification feed entry. */
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 200 }).notNull(),
  body: text('body'),
  readAt: timestamp('read_at', { withTimezone: true }),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  ...timestamps,
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
