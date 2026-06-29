import { sql } from './client.js';

/**
 * Seed a demo user with categories, sample income/expenses, and recurring
 * tasks. Implemented in M2 once the schema exists.
 */
async function main() {
  console.log('[db] seed placeholder — implemented in M2.');
  await sql.end();
}

main().catch((err) => {
  console.error('[db] seed failed:', err);
  process.exit(1);
});
