import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Postgres enums. Values mirror the Zod enums in @productivity/shared so the
 * DB, API validation, and UI all agree on the same literal sets.
 */
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const categoryTypeEnum = pgEnum('category_type', ['income', 'expense']);
export const recurrenceFrequencyEnum = pgEnum('recurrence_frequency', [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
]);
export const occurrenceStatusEnum = pgEnum('occurrence_status', ['pending', 'completed', 'skipped']);
export const expenseStatusEnum = pgEnum('expense_status', ['unpaid', 'paid']);
export const reminderChannelEnum = pgEnum('reminder_channel', ['in_app', 'telegram', 'alexa']);
export const reminderStatusEnum = pgEnum('reminder_status', [
  'pending',
  'sent',
  'failed',
  'cancelled',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'task_due',
  'task_overdue',
  'bill_due',
  'finance_summary',
  'system',
]);
