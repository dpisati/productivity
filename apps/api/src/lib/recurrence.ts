import { schema, type Database } from '@productivity/db';
import type { RecurrenceFrequency, RecurrenceInput, RecurrenceRule } from '@productivity/shared';

type RuleRow = typeof schema.recurringRules.$inferSelect;

/** YYYY-MM-DD for a Date using UTC components. */
function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Advance a UTC date by one step of the given frequency/interval. */
function step(date: Date, frequency: RecurrenceFrequency, interval: number): Date {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + interval);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + interval * 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + interval);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + interval);
      break;
    case 'custom':
      d.setUTCDate(d.getUTCDate() + 1); // cron resolved elsewhere; daily fallback
      break;
  }
  return d;
}

/**
 * Next occurrence at or after `from` for a non-custom rule. Returns null if the
 * rule has already ended. Custom (cron) rules are resolved by the scheduler.
 */
export function computeNextRunAt(input: RecurrenceInput, from: Date = new Date()): Date | null {
  if (input.frequency === 'custom') return new Date(`${input.startDate}T00:00:00Z`);

  const end = input.endDate ? new Date(`${input.endDate}T23:59:59Z`) : null;
  let cursor = new Date(`${input.startDate}T00:00:00Z`);
  for (let i = 0; i < 10_000 && cursor < from; i++) {
    cursor = step(cursor, input.frequency, input.interval);
  }
  if (end && cursor > end) return null;
  return cursor;
}

/**
 * Enumerate occurrence dates (YYYY-MM-DD) for a rule within the inclusive
 * [from, to] window. Custom/cron rules yield nothing here (handled later).
 */
export function enumerateOccurrences(
  rule: Pick<RuleRow, 'frequency' | 'interval' | 'startDate' | 'endDate'>,
  from: string,
  to: string,
): string[] {
  if (rule.frequency === 'custom') return [];

  const result: string[] = [];
  const fromD = new Date(`${from}T00:00:00Z`);
  const toD = new Date(`${to}T00:00:00Z`);
  const end = rule.endDate ? new Date(`${rule.endDate}T00:00:00Z`) : null;
  let cursor = new Date(`${rule.startDate}T00:00:00Z`);

  for (let i = 0; i < 2000 && cursor <= toD; i++) {
    if (end && cursor > end) break;
    if (cursor >= fromD) result.push(ymdUTC(cursor));
    cursor = step(cursor, rule.frequency, rule.interval);
  }
  return result;
}

/** Insert a recurring rule for a user and return the row. */
export async function createRecurringRule(
  db: Database,
  userId: string,
  input: RecurrenceInput,
): Promise<RuleRow> {
  const nextRunAt = computeNextRunAt(input);
  const [row] = await db
    .insert(schema.recurringRules)
    .values({
      userId,
      frequency: input.frequency,
      interval: input.interval,
      cron: input.cron ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      nextRunAt,
    })
    .returning();
  if (!row) throw new Error('failed to create recurring rule');
  return row;
}

export function mapRecurrenceRule(row: RuleRow | null | undefined): RecurrenceRule | null {
  if (!row) return null;
  return {
    id: row.id,
    frequency: row.frequency,
    interval: row.interval,
    cron: row.cron,
    startDate: row.startDate,
    endDate: row.endDate,
    nextRunAt: row.nextRunAt ? row.nextRunAt.toISOString() : null,
  };
}
