import { z } from 'zod';
import {
  createIncomeInput,
  income,
  listIncomeQuery,
  paginated,
  updateIncomeInput,
  uuid,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createIncomeService } from './income.service.js';

const idParam = z.object({ id: uuid });
const security = [{ bearerAuth: [] }];

export async function incomeRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createIncomeService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['income'],
        summary: 'List income (paginated, filterable)',
        security,
        querystring: listIncomeQuery,
        response: { 200: paginated(income) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.get(
    '/:id',
    {
      schema: { tags: ['income'], summary: 'Get one income record', security, params: idParam, response: { 200: income } },
    },
    (req) => svc.get(req.user!.id, req.params.id),
  );

  r.post(
    '/',
    {
      schema: { tags: ['income'], summary: 'Create income', security, body: createIncomeInput, response: { 201: income } },
    },
    async (req, reply) => reply.status(201).send(await svc.create(req.user!.id, req.body)),
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['income'],
        summary: 'Update income',
        security,
        params: idParam,
        body: updateIncomeInput,
        response: { 200: income },
      },
    },
    (req) => svc.update(req.user!.id, req.params.id, req.body),
  );

  r.delete(
    '/:id',
    {
      schema: { tags: ['income'], summary: 'Delete income (soft delete)', security, params: idParam, response: { 204: z.null() } },
    },
    async (req, reply) => {
      await svc.remove(req.user!.id, req.params.id);
      return reply.status(204).send(null);
    },
  );
}
