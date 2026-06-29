import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CategoryType,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@productivity/shared';
import { categoriesApi } from './api';

const key = ['categories'];

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: [...key, { type }],
    queryFn: () => categoriesApi.list({ type }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => categoriesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
