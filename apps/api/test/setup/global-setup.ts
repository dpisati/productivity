/**
 * Vitest global setup: ensure the test database exists and is migrated.
 * Uses TEST_DATABASE_URL (set in vitest.config.ts).
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL is not set');

  // The db package's client reads DATABASE_URL on import, so set it before the
  // dynamic import below initializes the connection pool.
  process.env.DATABASE_URL = url;
  const { ensureDatabase, runMigrations } = await import('@productivity/db');

  await ensureDatabase(url);
  await runMigrations(url);
}
