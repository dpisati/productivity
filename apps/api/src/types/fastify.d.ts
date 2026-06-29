import 'fastify';
import type { Database } from '@productivity/db';
import type { UserRole } from '@productivity/shared';
import type { Mailer } from '../lib/mailer.js';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database;
    mailer: Mailer;
    /** preHandler: require a valid access token; populates `request.user`. */
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** preHandler factory: require the authenticated user to hold one of `roles`. */
    authorize: (roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    user?: { id: string; role: UserRole; email: string };
  }
}
