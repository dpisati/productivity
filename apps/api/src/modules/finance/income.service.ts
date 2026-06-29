import { and, count, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  CreateIncomeInput,
  Income,
  ListIncomeQuery,
  Paginated,
  UpdateIncomeInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import { createRecurringRule, mapRecurrenceRule } from '../../lib/recurrence.js';

type IncomeRow = typeof schema.income.$inferSelect & {
  category?: typeof schema.categories.$inferSelect | null;
  recurringRule?: typeof schema.recurringRules.$inferSelect | null;
};

function mapIncome(row: IncomeRow): Income {
  return {
    id: row.id,
    amount: row.amount,
    date: row.date,
    description: row.description,
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

export function createIncomeService(app: FastifyInstance) {
  const { db } = app;
  const t = schema.income;

  async function ownedRow(userId: string, id: string): Promise<IncomeRow> {
    const row = await db.query.income.findFirst({
      where: and(eq(t.id, id), eq(t.userId, userId), isNull(t.deletedAt)),
      with: { category: true, recurringRule: true },
    });
    if (!row) throw new NotFoundError('Income not found');
    return row;
  }

  return {
    async list(userId: string, q: ListIncomeQuery): Promise<Paginated<Income>> {
      const conds = [eq(t.userId, userId), isNull(t.deletedAt)];
      if (q.from) conds.push(gte(t.date, q.from));
      if (q.to) conds.push(lte(t.date, q.to));
      if (q.categoryId) conds.push(eq(t.categoryId, q.categoryId));
      const where = and(...conds);

      const [rows, [totalRow]] = await Promise.all([
        db.query.income.findMany({
          where,
          with: { category: true, recurringRule: true },
          orderBy: [desc(t.date), desc(t.createdAt)],
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
        }),
        db.select({ value: count() }).from(t).where(where),
      ]);
      const total = totalRow?.value ?? 0;
      return {
        data: rows.map(mapIncome),
        meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
      };
    },

    get(userId: string, id: string): Promise<Income> {
      return ownedRow(userId, id).then(mapIncome);
    },

    async create(userId: string, input: CreateIncomeInput): Promise<Income> {
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
          date: input.date,
          categoryId: input.categoryId ?? null,
          description: input.description ?? null,
          isRecurring: !!input.recurrence,
          recurringRuleId,
        })
        .returning();
      await writeAudit(db, { userId, action: 'income.create', entity: 'income', entityId: row!.id });
      return this.get(userId, row!.id);
    },

    async update(userId: string, id: string, input: UpdateIncomeInput): Promise<Income> {
      await ownedRow(userId, id);
      await db
        .update(t)
        .set({
          ...(input.amount !== undefined ? { amount: input.amount } : {}),
          ...(input.date !== undefined ? { date: input.date } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
        })
        .where(and(eq(t.id, id), eq(t.userId, userId)));
      return this.get(userId, id);
    },

    async remove(userId: string, id: string): Promise<void> {
      await ownedRow(userId, id);
      await db.update(t).set({ deletedAt: new Date() }).where(and(eq(t.id, id), eq(t.userId, userId)));
      await writeAudit(db, { userId, action: 'income.delete', entity: 'income', entityId: id });
    },
  };
}
