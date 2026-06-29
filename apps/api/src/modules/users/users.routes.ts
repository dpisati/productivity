import { publicUser } from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { NotFoundError } from '../../lib/errors.js';
import { createAuthService } from '../auth/auth.service.js';

export async function usersRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const auth = createAuthService(app);

  r.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['users'],
        summary: 'Get the current authenticated user',
        security: [{ bearerAuth: [] }],
        response: { 200: publicUser },
      },
    },
    async (request) => {
      const user = await auth.getById(request.user!.id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },
  );
}
