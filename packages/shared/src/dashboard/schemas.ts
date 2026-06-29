import { z } from 'zod';
import { expenseStatus } from '../common/enums.js';
import { isoDate, money, uuid } from '../common/primitives.js';

/** Query for the monthly summary; defaults to the current month server-side. */
export const dashboardSummaryQuery = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, 'Expected YYYY-MM')
    .optional(),
});
export type DashboardSummaryQuery = z.infer<typeof dashboardSummaryQuery>;

export const upcomingBill = z.object({
  id: uuid,
  description: z.string().nullable(),
  amount: money,
  dueDate: isoDate,
  status: expenseStatus,
});
export type UpcomingBill = z.infer<typeof upcomingBill>;

export const categorySpend = z.object({
  categoryId: uuid.nullable(),
  name: z.string(),
  color: z.string().nullable(),
  total: money,
});
export type CategorySpend = z.infer<typeof categorySpend>;

export const dashboardSummary = z.object({
  month: z.string(),
  income: money,
  expenses: money,
  net: z.string(),
  savingsRate: z.number(),
  upcomingBills: z.array(upcomingBill),
  spendingByCategory: z.array(categorySpend),
});
export type DashboardSummary = z.infer<typeof dashboardSummary>;

export const cashflowQuery = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
});
export type CashflowQuery = z.infer<typeof cashflowQuery>;

export const cashflowPoint = z.object({
  month: z.string(),
  income: money,
  expenses: money,
  net: z.string(),
  projected: z.boolean(),
});
export type CashflowPoint = z.infer<typeof cashflowPoint>;

export const cashflowResponse = z.object({
  points: z.array(cashflowPoint),
});
export type CashflowResponse = z.infer<typeof cashflowResponse>;
