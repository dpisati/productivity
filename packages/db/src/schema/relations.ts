import { relations } from 'drizzle-orm';
import { users, userSettings } from './users';
import { categories } from './categories';
import { recurringRules } from './recurring';
import { expenses, income } from './finance';
import { taskOccurrences, tasks } from './tasks';
import { reminders } from './reminders';
import { alexaAccounts, telegramAccounts } from './integrations';
import { notifications } from './notifications';
import { auditLogs } from './audit';

export const usersRelations = relations(users, ({ one, many }) => ({
  settings: one(userSettings, { fields: [users.id], references: [userSettings.userId] }),
  telegramAccount: one(telegramAccounts, {
    fields: [users.id],
    references: [telegramAccounts.userId],
  }),
  alexaAccount: one(alexaAccounts, { fields: [users.id], references: [alexaAccounts.userId] }),
  categories: many(categories),
  income: many(income),
  expenses: many(expenses),
  tasks: many(tasks),
  recurringRules: many(recurringRules),
  reminders: many(reminders),
  notifications: many(notifications),
  auditLogs: many(auditLogs),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, { fields: [categories.userId], references: [users.id] }),
  income: many(income),
  expenses: many(expenses),
  tasks: many(tasks),
}));

export const recurringRulesRelations = relations(recurringRules, ({ one, many }) => ({
  user: one(users, { fields: [recurringRules.userId], references: [users.id] }),
  income: many(income),
  expenses: many(expenses),
  tasks: many(tasks),
}));

export const incomeRelations = relations(income, ({ one }) => ({
  user: one(users, { fields: [income.userId], references: [users.id] }),
  category: one(categories, { fields: [income.categoryId], references: [categories.id] }),
  recurringRule: one(recurringRules, {
    fields: [income.recurringRuleId],
    references: [recurringRules.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  user: one(users, { fields: [expenses.userId], references: [users.id] }),
  category: one(categories, { fields: [expenses.categoryId], references: [categories.id] }),
  recurringRule: one(recurringRules, {
    fields: [expenses.recurringRuleId],
    references: [recurringRules.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  category: one(categories, { fields: [tasks.categoryId], references: [categories.id] }),
  recurringRule: one(recurringRules, {
    fields: [tasks.recurringRuleId],
    references: [recurringRules.id],
  }),
  occurrences: many(taskOccurrences),
}));

export const taskOccurrencesRelations = relations(taskOccurrences, ({ one, many }) => ({
  task: one(tasks, { fields: [taskOccurrences.taskId], references: [tasks.id] }),
  reminders: many(reminders),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  user: one(users, { fields: [reminders.userId], references: [users.id] }),
  taskOccurrence: one(taskOccurrences, {
    fields: [reminders.taskOccurrenceId],
    references: [taskOccurrences.id],
  }),
}));

export const telegramAccountsRelations = relations(telegramAccounts, ({ one }) => ({
  user: one(users, { fields: [telegramAccounts.userId], references: [users.id] }),
}));

export const alexaAccountsRelations = relations(alexaAccounts, ({ one }) => ({
  user: one(users, { fields: [alexaAccounts.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
