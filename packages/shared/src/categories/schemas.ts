import { z } from 'zod';
import { categoryType } from '../common/enums.js';
import { hexColor, isoDateTime, uuid } from '../common/primitives.js';

export const category = z.object({
  id: uuid,
  type: categoryType,
  name: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});
export type Category = z.infer<typeof category>;

export const createCategoryInput = z.object({
  type: categoryType,
  name: z.string().min(1).max(80).trim(),
  color: hexColor.optional(),
  icon: z.string().max(40).optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategoryInput>;

export const updateCategoryInput = z.object({
  name: z.string().min(1).max(80).trim().optional(),
  color: hexColor.nullable().optional(),
  icon: z.string().max(40).nullable().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategoryInput>;

export const listCategoriesQuery = z.object({
  type: categoryType.optional(),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuery>;
