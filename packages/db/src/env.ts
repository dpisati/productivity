/**
 * Resolve the database connection string. Used by the Drizzle client, the
 * migrator, and the seed script. In Docker this points at the `postgres`
 * service; in production it points at Supabase.
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env (see packages/db/README).',
    );
  }
  return url;
}
