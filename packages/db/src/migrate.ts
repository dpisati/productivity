import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { getDatabaseUrl } from './env';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../drizzle');

/** Apply all pending SQL migrations from ./drizzle against the given URL. */
export async function runMigrations(databaseUrl: string = getDatabaseUrl()): Promise<void> {
  const connection = postgres(databaseUrl, { max: 1 });
  try {
    await migrate(drizzle(connection), { migrationsFolder });
  } finally {
    await connection.end();
  }
}

// CLI entry: `tsx src/migrate.ts`
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  console.log('[db] running migrations…');
  runMigrations()
    .then(() => {
      console.log('[db] migrations complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[db] migration failed:', err);
      process.exit(1);
    });
}
