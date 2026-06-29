import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { env } from './config/env.js';
import { dbPlugin } from './plugins/db.js';
import { authPlugin } from './plugins/auth.js';
import { swaggerPlugin } from './plugins/swagger.js';
import { errorHandlerPlugin } from './plugins/error-handler.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { categoriesRoutes } from './modules/categories/categories.routes.js';
import { incomeRoutes } from './modules/finance/income.routes.js';
import { expensesRoutes } from './modules/finance/expenses.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

/**
 * Build the Fastify application without starting it. Shared by the HTTP server
 * (server.ts) and integration tests (app.inject).
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Cross-cutting plugins
  await app.register(errorHandlerPlugin);
  await app.register(sensible);
  await app.register(cors, {
    origin: env.WEB_ORIGIN.split(',').map((o) => o.trim()),
    credentials: true,
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);

  // Feature modules (all under /api)
  await app.register(
    async (api) => {
      await api.register(healthRoutes);
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(usersRoutes, { prefix: '/users' });
      await api.register(categoriesRoutes, { prefix: '/categories' });
      await api.register(incomeRoutes, { prefix: '/income' });
      await api.register(expensesRoutes, { prefix: '/expenses' });
      await api.register(dashboardRoutes, { prefix: '/dashboard' });
    },
    { prefix: '/api' },
  );

  return app;
}
