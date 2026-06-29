import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from '@productivity/shared';
import { expensesApi } from './api';

const key = ['expenses'];

export function useExpenseList(query: ListExpensesQuery) {
  return useQuery({ queryKey: [...key, query], queryFn: () => expensesApi.list(query) });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) => expensesApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateExpenseInput }) => expensesApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
