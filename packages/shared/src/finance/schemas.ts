import { z } from 'zod';
import { expenseStatus } from '../common/enums.js';
import { isoDate, isoDateTime, money, uuid } from '../common/primitives.js';
import { recurrenceInput, recurrenceRule } from '../common/recurrence.js';
import { paginationQuery } from '../common/pagination.js';

/** Lightweight category reference embedded in finance records. */
export const categoryRef = z.object({
  id: uuid,
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
});
export type CategoryRef = z.infer<typeof categoryRef>;

// ── Income ──────────────────────────────────────────────────────────────────

export const income = z.object({
  id: uuid,
  amount: money,
  date: isoDate,
  description: z.string().nullable(),
  categoryId: uuid.nullable(),
  category: categoryRef.nullable(),
  isRecurring: z.boolean(),
  recurringRuleId: uuid.nullable(),
  recurringRule: recurrenceRule.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Income = z.infer<typeof income>;

export const createIncomeInput = z.object({
  amount: money,
  date: isoDate,
  categoryId: uuid.optional(),
  description: z.string().max(500).optional(),
  recurrence: recurrenceInput.optional(),
});
export type CreateIncomeInput = z.infer<typeof createIncomeInput>;

export const updateIncomeInput = z.object({
  amount: money.optional(),
  date: isoDate.optional(),
  categoryId: uuid.nullable().optional(),
  description: z.string().max(500).nullable().optional(),
});
export type UpdateIncomeInput = z.infer<typeof updateIncomeInput>;

export const listIncomeQuery = paginationQuery.extend({
  from: isoDate.optional(),
  to: isoDate.optional(),
  categoryId: uuid.optional(),
});
export type ListIncomeQuery = z.infer<typeof listIncomeQuery>;

// ── Expenses ────────────────────────────────────────────────────────────────

export const expense = z.object({
  id: uuid,
  amount: money,
  dueDate: isoDate,
  description: z.string().nullable(),
  status: expenseStatus,
  paidAt: isoDateTime.nullable(),
  categoryId: uuid.nullable(),
  category: categoryRef.nullable(),
  isRecurring: z.boolean(),
  recurringRuleId: uuid.nullable(),
  recurringRule: recurrenceRule.nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Expense = z.infer<typeof expense>;

export const createExpenseInput = z.object({
  amount: money,
  dueDate: isoDate,
  categoryId: uuid.optional(),
  description: z.string().max(500).optional(),
  status: expenseStatus.default('unpaid'),
  recurrence: recurrenceInput.optional(),
});
export type CreateExpenseInput = z.infer<typeof createExpenseInput>;

export const updateExpenseInput = z.object({
  amount: money.optional(),
  dueDate: isoDate.optional(),
  categoryId: uuid.nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: expenseStatus.optional(),
});
export type UpdateExpenseInput = z.infer<typeof updateExpenseInput>;

export const listExpensesQuery = paginationQuery.extend({
  from: isoDate.optional(),
  to: isoDate.optional(),
  categoryId: uuid.optional(),
  status: expenseStatus.optional(),
});
export type ListExpensesQuery = z.infer<typeof listExpensesQuery>;
