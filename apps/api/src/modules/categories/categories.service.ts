import { and, asc, eq, isNull } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  Category,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { ConflictError, NotFoundError } from '../../lib/errors.js';
import { writeAudit } from '../../lib/audit.js';

type CategoryRow = typeof schema.categories.$inferSelect;

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505';
}

export function createCategoriesService(app: FastifyInstance) {
  const { db } = app;
  const c = schema.categories;

  async function ownedRow(userId: string, id: string): Promise<CategoryRow> {
    const row = await db.query.categories.findFirst({
      where: and(eq(c.id, id), eq(c.userId, userId), isNull(c.deletedAt)),
    });
    if (!row) throw new NotFoundError('Category not found');
    return row;
  }

  return {
    async list(userId: string, query: ListCategoriesQuery): Promise<Category[]> {
      const conds = [eq(c.userId, userId), isNull(c.deletedAt)];
      if (query.type) conds.push(eq(c.type, query.type));
      const rows = await db
        .select()
        .from(c)
        .where(and(...conds))
        .orderBy(asc(c.type), asc(c.name));
      return rows.map(mapCategory);
    },

    async create(userId: string, input: CreateCategoryInput): Promise<Category> {
      try {
        const [row] = await db
          .insert(c)
          .values({
            userId,
            type: input.type,
            name: input.name,
            color: input.color ?? null,
            icon: input.icon ?? null,
          })
          .returning();
        await writeAudit(db, { userId, action: 'category.create', entity: 'category', entityId: row!.id });
        return mapCategory(row!);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ConflictError('A category with this name and type already exists');
        }
        throw err;
      }
    },

    async update(userId: string, id: string, input: UpdateCategoryInput): Promise<Category> {
      await ownedRow(userId, id);
      try {
        const [row] = await db
          .update(c)
          .set({
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.color !== undefined ? { color: input.color } : {}),
            ...(input.icon !== undefined ? { icon: input.icon } : {}),
          })
          .where(and(eq(c.id, id), eq(c.userId, userId)))
          .returning();
        return mapCategory(row!);
      } catch (err) {
        if (isUniqueViolation(err)) {
          throw new ConflictError('A category with this name and type already exists');
        }
        throw err;
      }
    },

    async remove(userId: string, id: string): Promise<void> {
      await ownedRow(userId, id);
      await db.update(c).set({ deletedAt: new Date() }).where(and(eq(c.id, id), eq(c.userId, userId)));
      await writeAudit(db, { userId, action: 'category.delete', entity: 'category', entityId: id });
    },
  };
}
