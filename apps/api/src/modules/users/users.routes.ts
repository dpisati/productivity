import { publicUser, updateSettingsInput, userSettings } from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { NotFoundError } from '../../lib/errors.js';
import { createAuthService } from '../auth/auth.service.js';
import { createSettingsService } from './settings.service.js';

const security = [{ bearerAuth: [] }];

export async function usersRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const auth = createAuthService(app);
  const settings = createSettingsService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/me',
    {
      schema: {
        tags: ['users'],
        summary: 'Get the current authenticated user',
        security,
        response: { 200: publicUser },
      },
    },
    async (request) => {
      const user = await auth.getById(request.user!.id);
      if (!user) throw new NotFoundError('User not found');
      return user;
    },
  );

  r.get(
    '/settings',
    {
      schema: {
        tags: ['users'],
        summary: 'Get the current user’s settings',
        security,
        response: { 200: userSettings },
      },
    },
    (request) => settings.get(request.user!.id),
  );

  r.patch(
    '/settings',
    {
      schema: {
        tags: ['users'],
        summary: 'Update the current user’s settings',
        security,
        body: updateSettingsInput,
        response: { 200: userSettings },
      },
    },
    (request) => settings.update(request.user!.id, request.body),
  );
}
