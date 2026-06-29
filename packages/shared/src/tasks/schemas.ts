import { z } from 'zod';
import { occurrenceStatus, taskPriority, taskStatus } from '../common/enums.js';
import { isoDate, isoDateTime, timeOfDay, uuid } from '../common/primitives.js';
import { recurrenceInput, recurrenceRule } from '../common/recurrence.js';
import { paginationQuery } from '../common/pagination.js';
import { categoryRef } from '../finance/schemas.js';

// ── Task ──────────────────────────────────────────────────────────────────

export const task = z.object({
  id: uuid,
  title: z.string(),
  description: z.string().nullable(),
  priority: taskPriority,
  status: taskStatus,
  dueDate: isoDate.nullable(),
  reminderTime: timeOfDay.nullable(),
  notes: z.string().nullable(),
  categoryId: uuid.nullable(),
  category: categoryRef.nullable(),
  isRecurring: z.boolean(),
  recurringRuleId: uuid.nullable(),
  recurringRule: recurrenceRule.nullable(),
  telegramEnabled: z.boolean(),
  alexaEnabled: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Task = z.infer<typeof task>;

export const createTaskInput = z.object({
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).optional(),
  priority: taskPriority.default('medium'),
  status: taskStatus.default('pending'),
  dueDate: isoDate.optional(),
  reminderTime: timeOfDay.optional(),
  notes: z.string().max(2000).optional(),
  categoryId: uuid.optional(),
  telegramEnabled: z.boolean().default(false),
  alexaEnabled: z.boolean().default(false),
  recurrence: recurrenceInput.optional(),
});
export type CreateTaskInput = z.infer<typeof createTaskInput>;

export const updateTaskInput = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(2000).nullable().optional(),
  priority: taskPriority.optional(),
  status: taskStatus.optional(),
  dueDate: isoDate.nullable().optional(),
  reminderTime: timeOfDay.nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  categoryId: uuid.nullable().optional(),
  telegramEnabled: z.boolean().optional(),
  alexaEnabled: z.boolean().optional(),
});
export type UpdateTaskInput = z.infer<typeof updateTaskInput>;

export const listTasksQuery = paginationQuery.extend({
  status: taskStatus.optional(),
  priority: taskPriority.optional(),
  categoryId: uuid.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

// ── Occurrence ──────────────────────────────────────────────────────────────

export const taskOccurrence = z.object({
  id: uuid,
  taskId: uuid,
  title: z.string(),
  occurrenceDate: isoDate,
  status: occurrenceStatus,
  completedAt: isoDateTime.nullable(),
  createdAt: isoDateTime,
});
export type TaskOccurrence = z.infer<typeof taskOccurrence>;

export const updateOccurrenceInput = z.object({
  status: occurrenceStatus,
});
export type UpdateOccurrenceInput = z.infer<typeof updateOccurrenceInput>;

export const listOccurrencesQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  status: occurrenceStatus.optional(),
});
export type ListOccurrencesQuery = z.infer<typeof listOccurrencesQuery>;
