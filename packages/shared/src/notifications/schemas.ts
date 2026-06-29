import { z } from 'zod';
import { notificationType } from '../common/enums.js';
import { isoDateTime, uuid } from '../common/primitives.js';
import { paginationQuery } from '../common/pagination.js';

export const notification = z.object({
  id: uuid,
  type: notificationType,
  title: z.string(),
  body: z.string().nullable(),
  readAt: isoDateTime.nullable(),
  payload: z.record(z.unknown()).nullable(),
  createdAt: isoDateTime,
});
export type Notification = z.infer<typeof notification>;

export const listNotificationsQuery = paginationQuery.extend({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;

export const unreadCountResponse = z.object({ count: z.number().int() });
export type UnreadCountResponse = z.infer<typeof unreadCountResponse>;
