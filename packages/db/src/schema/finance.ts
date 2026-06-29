import { boolean, date, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { softDelete, timestamps } from './_shared';
import { expenseStatusEnum } from './enums';
import { categories } from './categories';
import { recurringRules } from './recurring';
import { users } from './users';

export const income = pgTable('income', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  date: date('date', { mode: 'string' }).notNull(),
  description: text('description'),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringRuleId: uuid('recurring_rule_id').references(() => recurringRules.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
  ...softDelete,
});

export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  dueDate: date('due_date', { mode: 'string' }).notNull(),
  description: text('description'),
  status: expenseStatusEnum('status').notNull().default('unpaid'),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  isRecurring: boolean('is_recurring').notNull().default(false),
  recurringRuleId: uuid('recurring_rule_id').references(() => recurringRules.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
  ...softDelete,
});

export type Income = typeof income.$inferSelect;
export type NewIncome = typeof income.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
