import { z } from 'zod';
import {
  listNotificationsQuery,
  notification,
  paginated,
  unreadCountResponse,
  uuid,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createNotificationsService } from './notifications.service.js';

const idParam = z.object({ id: uuid });
const security = [{ bearerAuth: [] }];

export async function notificationsRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createNotificationsService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['notifications'],
        summary: 'List notifications',
        security,
        querystring: listNotificationsQuery,
        response: { 200: paginated(notification) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.get(
    '/unread-count',
    { schema: { tags: ['notifications'], summary: 'Unread notification count', security, response: { 200: unreadCountResponse } } },
    async (req) => ({ count: await svc.unreadCount(req.user!.id) }),
  );

  r.post(
    '/:id/read',
    { schema: { tags: ['notifications'], summary: 'Mark a notification read', security, params: idParam, response: { 200: notification } } },
    (req) => svc.markRead(req.user!.id, req.params.id),
  );

  r.post(
    '/read-all',
    { schema: { tags: ['notifications'], summary: 'Mark all notifications read', security, response: { 200: z.object({ updated: z.number().int() }) } } },
    async (req) => ({ updated: await svc.markAllRead(req.user!.id) }),
  );
}
