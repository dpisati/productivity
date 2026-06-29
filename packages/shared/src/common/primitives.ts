import { z } from 'zod';

/** A UUID v4 identifier. */
export const uuid = z.string().uuid();

/** ISO-8601 date-time string (e.g. "2026-06-29T20:00:00.000Z"). */
export const isoDateTime = z.string().datetime({ offset: true });

/** Calendar date string "YYYY-MM-DD". */
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/** Time-of-day string "HH:mm" (24h). */
export const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:mm');

/**
 * Monetary amount. Stored as numeric/decimal in Postgres and transported as a
 * string to avoid floating-point loss; validated as a non-negative decimal.
 */
export const money = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, 'Expected a decimal amount with up to 2 places');

export const email = z.string().email().toLowerCase().trim();

export const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128);

/** ISO-4217 currency code, e.g. "USD". */
export const currencyCode = z.string().length(3).toUpperCase();

/** Hex color like "#1d4ed8". */
export const hexColor = z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Expected hex color #rrggbb');
