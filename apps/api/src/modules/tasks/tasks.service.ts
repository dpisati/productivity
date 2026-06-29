import { and, asc, count, desc, eq, gte, isNull, lte } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  CreateTaskInput,
  ListOccurrencesQuery,
  ListTasksQuery,
  Paginated,
  Task,
  TaskOccurrence,
  UpdateOccurrenceInput,
  UpdateTaskInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';
import { createRecurringRule, mapRecurrenceRule } from '../../lib/recurrence.js';

type TaskRow = typeof schema.tasks.$inferSelect & {
  category?: typeof schema.categories.$inferSelect | null;
  recurringRule?: typeof schema.recurringRules.$inferSelect | null;
};
type OccurrenceRow = typeof schema.taskOccurrences.$inferSelect;

/** time column comes back as 'HH:MM:SS'; the API uses 'HH:mm'. */
const toHHmm = (t: string | null) => (t ? t.slice(0, 5) : null);

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate,
    reminderTime: toHHmm(row.reminderTime),
    notes: row.notes,
    categoryId: row.categoryId,
    category: row.category
      ? { id: row.category.id, name: row.category.name, color: row.category.color, icon: row.category.icon }
      : null,
    isRecurring: row.isRecurring,
    recurringRuleId: row.recurringRuleId,
    recurringRule: mapRecurrenceRule(row.recurringRule),
    telegramEnabled: row.telegramEnabled,
    alexaEnabled: row.alexaEnabled,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapOccurrence(row: OccurrenceRow, title: string): TaskOccurrence {
  return {
    id: row.id,
    taskId: row.taskId,
    title,
    occurrenceDate: row.occurrenceDate,
    status: row.status,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createTasksService(app: FastifyInstance) {
  const { db } = app;
  const t = schema.tasks;
  const occ = schema.taskOccurrences;

  async function ownedRow(userId: string, id: string): Promise<TaskRow> {
    const row = await db.query.tasks.findFirst({
      where: and(eq(t.id, id), eq(t.userId, userId), isNull(t.deletedAt)),
      with: { category: true, recurringRule: true },
    });
    if (!row) throw new NotFoundError('Task not found');
    return row;
  }

  /** Ensure a single occurrence exists for a non-recurring dated task. */
  async function ensureSingleOccurrence(taskId: string, dueDate: string | null) {
    if (!dueDate) return;
    await db.insert(occ).values({ taskId, occurrenceDate: dueDate }).onConflictDoNothing();
  }

  return {
    async list(userId: string, q: ListTasksQuery): Promise<Paginated<Task>> {
      const conds = [eq(t.userId, userId), isNull(t.deletedAt)];
      if (q.status) conds.push(eq(t.status, q.status));
      if (q.priority) conds.push(eq(t.priority, q.priority));
      if (q.categoryId) conds.push(eq(t.categoryId, q.categoryId));
      if (q.from) conds.push(gte(t.dueDate, q.from));
      if (q.to) conds.push(lte(t.dueDate, q.to));
      const where = and(...conds);

      const [rows, [totalRow]] = await Promise.all([
        db.query.tasks.findMany({
          where,
          with: { category: true, recurringRule: true },
          orderBy: [asc(t.dueDate), desc(t.createdAt)],
          limit: q.pageSize,
          offset: (q.page - 1) * q.pageSize,
        }),
        db.select({ value: count() }).from(t).where(where),
      ]);
      const total = totalRow?.value ?? 0;
      return {
        data: rows.map(mapTask),
        meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
      };
    },

    get(userId: string, id: string): Promise<Task> {
      return ownedRow(userId, id).then(mapTask);
    },

    async create(userId: string, input: CreateTaskInput): Promise<Task> {
      let recurringRuleId: string | null = null;
      if (input.recurrence) {
        const rule = await createRecurringRule(db, userId, input.recurrence);
        recurringRuleId = rule.id;
      }
      const [row] = await db
        .insert(t)
        .values({
          userId,
          title: input.title,
          description: input.description ?? null,
          priority: input.priority,
          status: input.status,
          dueDate: input.dueDate ?? null,
          reminderTime: input.reminderTime ?? null,
          notes: input.notes ?? null,
          categoryId: input.categoryId ?? null,
          telegramEnabled: input.telegramEnabled,
          alexaEnabled: input.alexaEnabled,
          isRecurring: !!input.recurrence,
          recurringRuleId,
        })
        .returning();
      if (!input.recurrence) await ensureSingleOccurrence(row!.id, row!.dueDate);
      await writeAudit(db, { userId, action: 'task.create', entity: 'task', entityId: row!.id });
      return this.get(userId, row!.id);
    },

    async update(userId: string, id: string, input: UpdateTaskInput): Promise<Task> {
      await ownedRow(userId, id);
      await db
        .update(t)
        .set({
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.priority !== undefined ? { priority: input.priority } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
          ...(input.reminderTime !== undefined ? { reminderTime: input.reminderTime } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
          ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
          ...(input.telegramEnabled !== undefined ? { telegramEnabled: input.telegramEnabled } : {}),
          ...(input.alexaEnabled !== undefined ? { alexaEnabled: input.alexaEnabled } : {}),
        })
        .where(and(eq(t.id, id), eq(t.userId, userId)));
      return this.get(userId, id);
    },

    async remove(userId: string, id: string): Promise<void> {
      await ownedRow(userId, id);
      await db.update(t).set({ deletedAt: new Date() }).where(and(eq(t.id, id), eq(t.userId, userId)));
      await writeAudit(db, { userId, action: 'task.delete', entity: 'task', entityId: id });
    },

    // ── Occurrences ──────────────────────────────────────────────────────────

    async listOccurrences(
      userId: string,
      taskId: string,
      q: ListOccurrencesQuery,
    ): Promise<TaskOccurrence[]> {
      const taskRow = await ownedRow(userId, taskId);
      const conds = [eq(occ.taskId, taskId)];
      if (q.from) conds.push(gte(occ.occurrenceDate, q.from));
      if (q.to) conds.push(lte(occ.occurrenceDate, q.to));
      if (q.status) conds.push(eq(occ.status, q.status));
      const rows = await db
        .select()
        .from(occ)
        .where(and(...conds))
        .orderBy(asc(occ.occurrenceDate));
      return rows.map((r) => mapOccurrence(r, taskRow.title));
    },

    async updateOccurrence(
      userId: string,
      taskId: string,
      occurrenceId: string,
      input: UpdateOccurrenceInput,
    ): Promise<TaskOccurrence> {
      const taskRow = await ownedRow(userId, taskId);
      const existing = await db.query.taskOccurrences.findFirst({
        where: and(eq(occ.id, occurrenceId), eq(occ.taskId, taskId)),
      });
      if (!existing) throw new NotFoundError('Occurrence not found');

      const [row] = await db
        .update(occ)
        .set({
          status: input.status,
          completedAt: input.status === 'completed' ? new Date() : null,
        })
        .where(eq(occ.id, occurrenceId))
        .returning();
      return mapOccurrence(row!, taskRow.title);
    },
  };
}
