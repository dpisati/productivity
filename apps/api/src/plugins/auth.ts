import fp from 'fastify-plugin';
import type { UserRole } from '@productivity/shared';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/tokens.js';

/**
 * Provides `app.authenticate` (Bearer access-token guard) and `app.authorize`
 * (role guard). Apply via route `preHandler`.
 */
export const authPlugin = fp(
  async (app) => {
    app.decorate('authenticate', async (request) => {
      const header = request.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing bearer token');
      }
      const claims = verifyAccessToken(header.slice('Bearer '.length).trim());
      request.user = { id: claims.sub, role: claims.role, email: claims.email };
    });

    app.decorate('authorize', (roles: UserRole[]) => async (request) => {
      if (!request.user) throw new UnauthorizedError();
      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
    });
  },
  { name: 'auth', dependencies: [] },
);
