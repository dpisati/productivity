import { z } from 'zod';
import {
  createTaskInput,
  listOccurrencesQuery,
  listTasksQuery,
  paginated,
  task,
  taskOccurrence,
  updateOccurrenceInput,
  updateTaskInput,
  uuid,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createTasksService } from './tasks.service.js';

const idParam = z.object({ id: uuid });
const occParam = z.object({ id: uuid, occId: uuid });
const security = [{ bearerAuth: [] }];

export async function tasksRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createTasksService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['tasks'],
        summary: 'List tasks (paginated, filterable)',
        security,
        querystring: listTasksQuery,
        response: { 200: paginated(task) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.get(
    '/:id',
    { schema: { tags: ['tasks'], summary: 'Get a task', security, params: idParam, response: { 200: task } } },
    (req) => svc.get(req.user!.id, req.params.id),
  );

  r.post(
    '/',
    { schema: { tags: ['tasks'], summary: 'Create a task', security, body: createTaskInput, response: { 201: task } } },
    async (req, reply) => reply.status(201).send(await svc.create(req.user!.id, req.body)),
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Update a task',
        security,
        params: idParam,
        body: updateTaskInput,
        response: { 200: task },
      },
    },
    (req) => svc.update(req.user!.id, req.params.id, req.body),
  );

  r.delete(
    '/:id',
    { schema: { tags: ['tasks'], summary: 'Delete a task (soft delete)', security, params: idParam, response: { 204: z.null() } } },
    async (req, reply) => {
      await svc.remove(req.user!.id, req.params.id);
      return reply.status(204).send(null);
    },
  );

  // ── Occurrences ────────────────────────────────────────────────────────────

  r.get(
    '/:id/occurrences',
    {
      schema: {
        tags: ['tasks'],
        summary: 'List a task’s occurrences',
        security,
        params: idParam,
        querystring: listOccurrencesQuery,
        response: { 200: z.array(taskOccurrence) },
      },
    },
    (req) => svc.listOccurrences(req.user!.id, req.params.id, req.query),
  );

  r.patch(
    '/:id/occurrences/:occId',
    {
      schema: {
        tags: ['tasks'],
        summary: 'Update an occurrence status (complete/skip)',
        security,
        params: occParam,
        body: updateOccurrenceInput,
        response: { 200: taskOccurrence },
      },
    },
    (req) => svc.updateOccurrence(req.user!.id, req.params.id, req.params.occId, req.body),
  );
}
