import { pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core';
import { softDelete, timestamps } from './_shared';
import { categoryTypeEnum } from './enums';
import { users } from './users';

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: categoryTypeEnum('type').notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    color: varchar('color', { length: 7 }),
    icon: varchar('icon', { length: 40 }),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    // A user cannot have two categories of the same type with the same name.
    uniqueNamePerType: unique('categories_user_type_name_uq').on(t.userId, t.type, t.name),
  }),
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
