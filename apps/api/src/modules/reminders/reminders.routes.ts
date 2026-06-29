import {
  listRemindersQuery,
  paginated,
  reminder,
  uuid,
} from '@productivity/shared';
import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createRemindersService } from './reminders.service.js';

const idParam = z.object({ id: uuid });
const security = [{ bearerAuth: [] }];

export async function remindersRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createRemindersService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['reminders'],
        summary: 'List reminders',
        security,
        querystring: listRemindersQuery,
        response: { 200: paginated(reminder) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.post(
    '/:id/cancel',
    { schema: { tags: ['reminders'], summary: 'Cancel a pending reminder', security, params: idParam, response: { 200: reminder } } },
    (req) => svc.cancel(req.user!.id, req.params.id),
  );
}
