import { z } from 'zod';
import { recurrenceFrequency } from './enums.js';
import { isoDate, isoDateTime, uuid } from './primitives.js';

/**
 * Recurrence definition reused by income, expenses, and tasks. For `custom`,
 * a cron expression is required; otherwise `interval` repeats the unit.
 */
export const recurrenceInput = z
  .object({
    frequency: recurrenceFrequency,
    interval: z.number().int().min(1).max(366).default(1),
    cron: z.string().min(1).max(120).optional(),
    startDate: isoDate,
    endDate: isoDate.optional(),
  })
  .refine((v) => v.frequency !== 'custom' || !!v.cron, {
    message: 'cron is required when frequency is "custom"',
    path: ['cron'],
  });
export type RecurrenceInput = z.infer<typeof recurrenceInput>;

export const recurrenceRule = z.object({
  id: uuid,
  frequency: recurrenceFrequency,
  interval: z.number().int(),
  cron: z.string().nullable(),
  startDate: isoDate,
  endDate: isoDate.nullable(),
  nextRunAt: isoDateTime.nullable(),
});
export type RecurrenceRule = z.infer<typeof recurrenceRule>;
