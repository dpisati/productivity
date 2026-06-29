import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getDatabaseUrl } from './env';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Apply all pending SQL migrations from ./drizzle, then exit. */
async function main() {
  const connection = postgres(getDatabaseUrl(), { max: 1 });
  const db = drizzle(connection);
  const migrationsFolder = resolve(__dirname, '../drizzle');

  console.log('[db] running migrations…');
  await migrate(db, { migrationsFolder });
  console.log('[db] migrations complete.');

  await connection.end();
}

main().catch((err) => {
  console.error('[db] migration failed:', err);
  process.exit(1);
});
