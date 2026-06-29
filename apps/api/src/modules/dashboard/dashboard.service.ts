import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  CashflowResponse,
  CategorySpend,
  DashboardSummary,
  UpcomingBill,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';

/** First day (inclusive) and next-month first day (exclusive) for a YYYY-MM. */
function monthBounds(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const next = m === 12 ? `${y! + 1}-01-01` : `${y}-${String(m! + 1).padStart(2, '0')}-01`;
  return { start, end: next };
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y!, m! - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

const num = (v: string | null) => Number(v ?? 0);

export function createDashboardService(app: FastifyInstance) {
  const { db } = app;
  const inc = schema.income;
  const exp = schema.expenses;
  const cat = schema.categories;

  async function sumIncome(userId: string, start: string, end: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<string>`coalesce(sum(${inc.amount}), 0)::text` })
      .from(inc)
      .where(and(eq(inc.userId, userId), isNull(inc.deletedAt), gte(inc.date, start), lt(inc.date, end)));
    return num(row?.total ?? null);
  }

  async function sumExpenses(userId: string, start: string, end: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<string>`coalesce(sum(${exp.amount}), 0)::text` })
      .from(exp)
      .where(and(eq(exp.userId, userId), isNull(exp.deletedAt), gte(exp.dueDate, start), lt(exp.dueDate, end)));
    return num(row?.total ?? null);
  }

  return {
    async summary(userId: string, month = currentMonth()): Promise<DashboardSummary> {
      const { start, end } = monthBounds(month);

      const [incomeTotal, expensesTotal, spendRows, billRows] = await Promise.all([
        sumIncome(userId, start, end),
        sumExpenses(userId, start, end),
        db
          .select({
            categoryId: exp.categoryId,
            name: cat.name,
            color: cat.color,
            total: sql<string>`coalesce(sum(${exp.amount}), 0)::text`,
          })
          .from(exp)
          .leftJoin(cat, eq(exp.categoryId, cat.id))
          .where(and(eq(exp.userId, userId), isNull(exp.deletedAt), gte(exp.dueDate, start), lt(exp.dueDate, end)))
          .groupBy(exp.categoryId, cat.name, cat.color),
        db
          .select({ id: exp.id, description: exp.description, amount: exp.amount, dueDate: exp.dueDate, status: exp.status })
          .from(exp)
          .where(
            and(
              eq(exp.userId, userId),
              isNull(exp.deletedAt),
              eq(exp.status, 'unpaid'),
              gte(exp.dueDate, new Date().toISOString().slice(0, 10)),
            ),
          )
          .orderBy(exp.dueDate)
          .limit(10),
      ]);

      const net = incomeTotal - expensesTotal;
      const savingsRate = incomeTotal > 0 ? Number(((net / incomeTotal) * 100).toFixed(1)) : 0;

      const spendingByCategory: CategorySpend[] = spendRows.map((r) => ({
        categoryId: r.categoryId,
        name: r.name ?? 'Uncategorized',
        color: r.color ?? null,
        total: Number(r.total).toFixed(2),
      }));
      const upcomingBills: UpcomingBill[] = billRows.map((b) => ({
        id: b.id,
        description: b.description,
        amount: b.amount,
        dueDate: b.dueDate,
        status: b.status,
      }));

      return {
        month,
        income: incomeTotal.toFixed(2),
        expenses: expensesTotal.toFixed(2),
        net: net.toFixed(2),
        savingsRate,
        upcomingBills,
        spendingByCategory,
      };
    },

    async cashflow(userId: string, months: number): Promise<CashflowResponse> {
      const current = currentMonth();
      const rangeStart = `${shiftMonth(current, -(months - 1))}-01`;

      const [incomeRows, expenseRows] = await Promise.all([
        db
          .select({ month: sql<string>`to_char(${inc.date}::date, 'YYYY-MM')`, total: sql<string>`sum(${inc.amount})::text` })
          .from(inc)
          .where(and(eq(inc.userId, userId), isNull(inc.deletedAt), gte(inc.date, rangeStart)))
          .groupBy(sql`to_char(${inc.date}::date, 'YYYY-MM')`),
        db
          .select({ month: sql<string>`to_char(${exp.dueDate}::date, 'YYYY-MM')`, total: sql<string>`sum(${exp.amount})::text` })
          .from(exp)
          .where(and(eq(exp.userId, userId), isNull(exp.deletedAt), gte(exp.dueDate, rangeStart)))
          .groupBy(sql`to_char(${exp.dueDate}::date, 'YYYY-MM')`),
      ]);

      const incomeByMonth = new Map(incomeRows.map((r) => [r.month, num(r.total)]));
      const expenseByMonth = new Map(expenseRows.map((r) => [r.month, num(r.total)]));

      const points = [];
      for (let i = months - 1; i >= 0; i--) {
        const month = shiftMonth(current, -i);
        const income = incomeByMonth.get(month) ?? 0;
        const expenses = expenseByMonth.get(month) ?? 0;
        points.push({
          month,
          income: income.toFixed(2),
          expenses: expenses.toFixed(2),
          net: (income - expenses).toFixed(2),
          projected: false,
        });
      }

      // Naive next-month projection from recurring commitments.
      const [recIncome, recExpense] = await Promise.all([
        db
          .select({ total: sql<string>`coalesce(sum(${inc.amount}), 0)::text` })
          .from(inc)
          .where(and(eq(inc.userId, userId), isNull(inc.deletedAt), eq(inc.isRecurring, true))),
        db
          .select({ total: sql<string>`coalesce(sum(${exp.amount}), 0)::text` })
          .from(exp)
          .where(and(eq(exp.userId, userId), isNull(exp.deletedAt), eq(exp.isRecurring, true))),
      ]);
      const projIncome = num(recIncome[0]?.total ?? null);
      const projExpense = num(recExpense[0]?.total ?? null);
      points.push({
        month: shiftMonth(current, 1),
        income: projIncome.toFixed(2),
        expenses: projExpense.toFixed(2),
        net: (projIncome - projExpense).toFixed(2),
        projected: true,
      });

      return { points };
    },
  };
}
