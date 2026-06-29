import { timestamp } from 'drizzle-orm/pg-core';

/**
 * Reusable column groups, spread into table definitions for consistency.
 * `casing: 'snake_case'` (set on the client + drizzle.config) maps these
 * camelCase keys to snake_case columns.
 */

/** created_at / updated_at, both managed automatically. */
export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Nullable deleted_at marker for soft-deletable tables. */
export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
};
