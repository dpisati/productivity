import fp from 'fastify-plugin';
import { db, sql } from '@productivity/db';
import { createDevMailer } from '../lib/mailer.js';

/**
 * Decorate the app with the Drizzle `db` client and a `mailer`, and close the
 * connection pool on shutdown.
 */
export const dbPlugin = fp(
  async (app) => {
    app.decorate('db', db);
    app.decorate('mailer', createDevMailer(app.log));

    app.addHook('onClose', async () => {
      await sql.end({ timeout: 5 });
    });
  },
  { name: 'db' },
);
