import { schema, type Database } from '@productivity/db';
import type { RecurrenceInput, RecurrenceRule } from '@productivity/shared';

type RuleRow = typeof schema.recurringRules.$inferSelect;

function addByFrequency(date: Date, input: RecurrenceInput): Date {
  const d = new Date(date);
  const n = input.interval;
  switch (input.frequency) {
    case 'daily':
      d.setUTCDate(d.getUTCDate() + n);
      break;
    case 'weekly':
      d.setUTCDate(d.getUTCDate() + n * 7);
      break;
    case 'monthly':
      d.setUTCMonth(d.getUTCMonth() + n);
      break;
    case 'yearly':
      d.setUTCFullYear(d.getUTCFullYear() + n);
      break;
    case 'custom':
      // cron-driven; advanced by the scheduler (M5). Step a day as a fallback.
      d.setUTCDate(d.getUTCDate() + 1);
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
  // Guard against pathological loops.
  for (let i = 0; i < 10_000 && cursor < from; i++) {
    cursor = addByFrequency(cursor, input);
  }
  if (end && cursor > end) return null;
  return cursor;
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
