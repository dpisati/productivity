import { and, count, desc, eq, isNull } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  ListNotificationsQuery,
  Notification,
  Paginated,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { NotFoundError } from '../../lib/errors.js';

type NotificationRow = typeof schema.notifications.$inferSelect;

function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    payload: row.payload ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createNotificationsService(app: FastifyInstance) {
  const { db } = app;
  const n = schema.notifications;

  return {
    async list(userId: string, q: ListNotificationsQuery): Promise<Paginated<Notification>> {
      const conds = [eq(n.userId, userId)];
      if (q.unread === true) conds.push(isNull(n.readAt));
      const where = and(...conds);

      const [rows, [totalRow]] = await Promise.all([
        db
          .select()
          .from(n)
          .where(where)
          .orderBy(desc(n.createdAt))
          .limit(q.pageSize)
          .offset((q.page - 1) * q.pageSize),
        db.select({ value: count() }).from(n).where(where),
      ]);
      const total = totalRow?.value ?? 0;
      return {
        data: rows.map(mapNotification),
        meta: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.ceil(total / q.pageSize) },
      };
    },

    async unreadCount(userId: string): Promise<number> {
      const [row] = await db
        .select({ value: count() })
        .from(n)
        .where(and(eq(n.userId, userId), isNull(n.readAt)));
      return row?.value ?? 0;
    },

    async markRead(userId: string, id: string): Promise<Notification> {
      const existing = await db.query.notifications.findFirst({
        where: and(eq(n.id, id), eq(n.userId, userId)),
      });
      if (!existing) throw new NotFoundError('Notification not found');
      const [row] = await db
        .update(n)
        .set({ readAt: existing.readAt ?? new Date() })
        .where(eq(n.id, id))
        .returning();
      return mapNotification(row!);
    },

    async markAllRead(userId: string): Promise<number> {
      const rows = await db
        .update(n)
        .set({ readAt: new Date() })
        .where(and(eq(n.userId, userId), isNull(n.readAt)))
        .returning({ id: n.id });
      return rows.length;
    },
  };
}
