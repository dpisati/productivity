import { and, count, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  CreateExpenseInput,
  Expense,
  ListExpensesQuery,
  Paginated,
  UpdateExpenseInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import { createRecurringRule, mapRecurrenceRule } from '../../lib/recurrence.js';

type ExpenseRow = typeof schema.expenses.$inferSelect & {
  category?: typeof schema.categories.$inferSelect | null;
  recurringRule?: typeof schema.recurringRules.$inferSelect | null;
};

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    dueDate: row.dueDate,
    description: row.description,
    status: row.status,
    paidAt: row.paidAt ? row.paidAt.toISOString() : null,
    categoryId: row.categoryId,
    category: row.category
      ? { id: row.category.id, name: row.category.name, color: row.category.color, icon: row.category.icon }
      : null,
    isRecurring: row.isRecurring,
    recurringRuleId: row.recurringRuleId,
    recurringRule: mapRecurrenceRule(row.recurringRule),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function createExpensesService(app: FastifyInstance) {
  const { db } = app;
  const t = schema.expenses;

  async function ownedRow(userId: string, id: string): Promise<ExpenseRow> {
    const row = await db.query.expenses.findFirst({
      where: and(eq(t.id, id), eq(t.userId, userId), isNull(t.deletedAt)),
      with: { category: true, recurringRule: true },
    });
    if (!row) throw new NotFoundError('Expense not found');
    return row;
  }

  return {
    async list(userId: string, q: ListExpensesQuery): Promise<Paginated<Expense>> {
      const conds = [eq(t.userId, userId), isNull(t.deletedAt)];
      if (q.from) conds.push(gte(t.dueDate, q.from));
      if (q.to) conds.push(lte(t.dueDate, q.to));
      if (q.categoryId) conds.push(eq(t.categoryId, q.categoryId));
      if (q.status) conds.push(eq(t.status, q.status));
      const where = and(...conds);

      const [rows, [totalRow]] = await Promise.all([
        db.query.expenses.findMany({
          where,
          with: { category: true, recurringRule: true },
          orderBy: [desc(t.dueDate), desc(t.createdAt)],
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
        }),
        db.select({ value: count() }).from(t).where(where),
      ]);
      const total = totalRow?.value ?? 0;
      return {
        data: rows.map(mapExpense),
        meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
      };
    },

    get(userId: string, id: string): Promise<Expense> {
      return ownedRow(userId, id).then(mapExpense);
    },

    async create(userId: string, input: CreateExpenseInput): Promise<Expense> {
      let recurringRuleId: string | null = null;
      if (input.recurrence) {
        const rule = await createRecurringRule(db, userId, input.recurrence);
        recurringRuleId = rule.id;
      }
      const [row] = await db
        .insert(t)
        .values({
          userId,
          amount: input.amount,
          dueDate: input.dueDate,
          categoryId: input.categoryId ?? null,
          description: input.description ?? null,
          status: input.status,
          paidAt: input.status === 'paid' ? new Date() : null,
          isRecurring: !!input.recurrence,
          recurringRuleId,
        })
        .returning();
      await writeAudit(db, { userId, action: 'expense.create', entity: 'expense', entityId: row!.id });
      return this.get(userId, row!.id);
    },

    async update(userId: string, id: string, input: UpdateExpenseInput): Promise<Expense> {
      const current = await ownedRow(userId, id);
      // Keep paidAt consistent with status transitions.
      let paidAt: Date | null | undefined;
      if (input.status === 'paid' && current.status !== 'paid') paidAt = new Date();
      else if (input.status === 'unpaid') paidAt = null;

      await db
        .update(t)
        .set({
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(paidAt !== undefined ? { paidAt } : {}),
        })
        .where(and(eq(t.id, id), eq(t.userId, userId)));
      return this.get(userId, id);
    },

    async remove(userId: string, id: string): Promise<void> {
      await ownedRow(userId, id);
      await db.update(t).set({ deletedAt: new Date() }).where(and(eq(t.id, id), eq(t.userId, userId)));
      await writeAudit(db, { userId, action: 'expense.delete', entity: 'expense', entityId: id });
    },
  };
}
