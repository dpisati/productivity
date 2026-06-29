import { z } from 'zod';

export const userRole = z.enum(['user', 'admin']);
export type UserRole = z.infer<typeof userRole>;

export const categoryType = z.enum(['income', 'expense']);
export type CategoryType = z.infer<typeof categoryType>;

export const recurrenceFrequency = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']);
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequency>;

export const taskPriority = z.enum(['low', 'medium', 'high', 'urgent']);
export type TaskPriority = z.infer<typeof taskPriority>;

export const taskStatus = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);
export type TaskStatus = z.infer<typeof taskStatus>;

export const occurrenceStatus = z.enum(['pending', 'completed', 'skipped']);
export type OccurrenceStatus = z.infer<typeof occurrenceStatus>;

export const expenseStatus = z.enum(['unpaid', 'paid']);
export type ExpenseStatus = z.infer<typeof expenseStatus>;

export const reminderChannel = z.enum(['in_app', 'telegram', 'alexa']);
export type ReminderChannel = z.infer<typeof reminderChannel>;

export const reminderStatus = z.enum(['pending', 'sent', 'failed', 'cancelled']);
export type ReminderStatus = z.infer<typeof reminderStatus>;

export const notificationType = z.enum([
  'task_due',
  'task_overdue',
  'bill_due',
  'finance_summary',
  'system',
]);
export type NotificationType = z.infer<typeof notificationType>;
