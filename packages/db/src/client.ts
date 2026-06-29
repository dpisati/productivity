import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getDatabaseUrl } from './env.js';
import * as schema from './schema/index.js';

/**
 * Long-lived postgres connection pool + Drizzle client.
 *
 * Import `db` for queries and `sql` for raw access / graceful shutdown.
 */
export const sql = postgres(getDatabaseUrl(), { max: 10 });

export const db = drizzle(sql, { schema, casing: 'snake_case' });

export type Database = typeof db;
export { schema };
