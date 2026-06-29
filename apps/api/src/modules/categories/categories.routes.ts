import { z } from 'zod';
import {
  category,
  createCategoryInput,
  listCategoriesQuery,
  updateCategoryInput,
  uuid,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createCategoriesService } from './categories.service.js';

const idParam = z.object({ id: uuid });
const security = [{ bearerAuth: [] }];

export async function categoriesRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createCategoriesService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/',
    {
      schema: {
        tags: ['categories'],
        summary: 'List categories',
        security,
        querystring: listCategoriesQuery,
        response: { 200: z.array(category) },
      },
    },
    (req) => svc.list(req.user!.id, req.query),
  );

  r.post(
    '/',
    {
      schema: {
        tags: ['categories'],
        summary: 'Create a category',
        security,
        body: createCategoryInput,
        response: { 201: category },
      },
    },
    async (req, reply) => reply.status(201).send(await svc.create(req.user!.id, req.body)),
  );

  r.patch(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Update a category',
        security,
        params: idParam,
        body: updateCategoryInput,
        response: { 200: category },
      },
    },
    (req) => svc.update(req.user!.id, req.params.id, req.body),
  );

  r.delete(
    '/:id',
    {
      schema: {
        tags: ['categories'],
        summary: 'Delete a category (soft delete)',
        security,
        params: idParam,
        response: { 204: z.null() },
      },
    },
    async (req, reply) => {
      await svc.remove(req.user!.id, req.params.id);
      return reply.status(204).send(null);
    },
  );
}
