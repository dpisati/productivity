import { bigint, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_shared';
import { users } from './users';

/** Telegram account linked to a user via a one-time link token. */
export const telegramAccounts = pgTable('telegram_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  telegramChatId: bigint('telegram_chat_id', { mode: 'number' }),
  telegramUsername: varchar('telegram_username', { length: 64 }),
  linkToken: varchar('link_token', { length: 64 }),
  linkedAt: timestamp('linked_at', { withTimezone: true }),
  ...timestamps,
});

/** Amazon/Alexa account linking + OAuth tokens (populated when M9+ wires Alexa). */
export const alexaAccounts = pgTable('alexa_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  amazonUserId: varchar('amazon_user_id', { length: 255 }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  ...timestamps,
});

export type TelegramAccount = typeof telegramAccounts.$inferSelect;
export type NewTelegramAccount = typeof telegramAccounts.$inferInsert;
export type AlexaAccount = typeof alexaAccounts.$inferSelect;
export type NewAlexaAccount = typeof alexaAccounts.$inferInsert;
