import { z } from 'zod';
import {
  createExpenseInput,
  expense,
  listExpensesQuery,
  paginated,
  updateExpenseInput,
  uuid,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createExpensesService } from './expenses.service.js';

const idParam = z.object({ id: uuid });
const security = [{ bearerAuth: [] }];

export async function expensesRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createExpensesService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['expenses'],
        summary: 'List expenses (paginated, filterable)',
        security,
        querystring: listExpensesQuery,
        response: { 200: paginated(expense) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.get(
    '/:id',
    {
      schema: { tags: ['expenses'], summary: 'Get one expense', security, params: idParam, response: { 200: expense } },
    },
    (req) => svc.get(req.user!.id, req.params.id),
  );

  r.post(
    '/',
    {
      schema: { tags: ['expenses'], summary: 'Create expense', security, body: createExpenseInput, response: { 201: expense } },
    },
    async (req, reply) => reply.status(201).send(await svc.create(req.user!.id, req.body)),
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['expenses'],
        summary: 'Update expense (incl. mark paid/unpaid)',
        security,
        params: idParam,
        body: updateExpenseInput,
        response: { 200: expense },
      },
    },
    (req) => svc.update(req.user!.id, req.params.id, req.body),
  );

  r.delete(
    '/:id',
    {
      schema: { tags: ['expenses'], summary: 'Delete expense (soft delete)', security, params: idParam, response: { 204: z.null() } },
    },
    async (req, reply) => {
      await svc.remove(req.user!.id, req.params.id);
      return reply.status(204).send(null);
    },
  );
}
