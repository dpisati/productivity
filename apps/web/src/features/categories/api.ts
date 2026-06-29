import type {
  Category,
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const categoriesApi = {
  list: (query: ListCategoriesQuery = {}) =>
    api.get<Category[]>('/categories', { type: query.type }),
  create: (input: CreateCategoryInput) => api.post<Category>('/categories', input),
  update: (id: string, input: UpdateCategoryInput) => api.patch<Category>(`/categories/${id}`, input),
  remove: (id: string) => api.delete<void>(`/categories/${id}`),
};
