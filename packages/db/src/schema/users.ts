import { boolean, pgTable, text, time, uuid, varchar } from 'drizzle-orm/pg-core';
import { softDelete, timestamps } from './_shared';
import { userRoleEnum } from './enums';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  role: userRoleEnum('role').notNull().default('user'),
  emailVerified: boolean('email_verified').notNull().default(false),
  ...timestamps,
  ...softDelete,
});

/** 1:1 per-user preferences. */
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  timezone: varchar('timezone', { length: 64 }).notNull().default('UTC'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  locale: varchar('locale', { length: 10 }).notNull().default('en'),
  theme: varchar('theme', { length: 10 }).notNull().default('system'),
  defaultReminderTime: time('default_reminder_time').notNull().default('09:00'),
  ...timestamps,
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
