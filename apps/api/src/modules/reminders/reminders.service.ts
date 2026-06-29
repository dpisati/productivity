import { and, count, desc, eq } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type { ListRemindersQuery, Paginated, Reminder } from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';

type ReminderRow = typeof schema.reminders.$inferSelect;

function mapReminder(row: ReminderRow): Reminder {
  return {
    id: row.id,
    taskOccurrenceId: row.taskOccurrenceId,
    channel: row.channel,
    scheduledFor: row.scheduledFor.toISOString(),
    status: row.status,
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
    externalId: row.externalId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createRemindersService(app: FastifyInstance) {
  const { db } = app;
  const rem = schema.reminders;

  return {
    async list(userId: string, q: ListRemindersQuery): Promise<Paginated<Reminder>> {
      const conds = [eq(rem.userId, userId)];
      if (q.status) conds.push(eq(rem.status, q.status));
      if (q.channel) conds.push(eq(rem.channel, q.channel));
      const where = and(...conds);

      const [rows, [totalRow]] = await Promise.all([
        db
          .select()
          .from(rem)
          .where(where)
          .orderBy(desc(rem.scheduledFor))
          .limit(q.pageSize)
          .offset((q.page - 1) * q.pageSize),
        db.select({ value: count() }).from(rem).where(where),
      ]);
      const total = totalRow?.value ?? 0;
      return {
        data: rows.map(mapReminder),
        meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
      };
    },

    async cancel(userId: string, id: string): Promise<Reminder> {
      const existing = await db.query.reminders.findFirst({
        where: and(eq(rem.id, id), eq(rem.userId, userId)),
      });
      if (!existing) throw new NotFoundError('Reminder not found');
      const [row] = await db
        .update(rem)
        .set({ status: 'cancelled' })
        .where(eq(rem.id, id))
        .returning();
      return mapReminder(row!);
    },
  };
}
