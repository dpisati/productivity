import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateIncomeInput, ListIncomeQuery, UpdateIncomeInput } from '@productivity/shared';
import { incomeApi } from './api';

const key = ['income'];

export function useIncomeList(query: ListIncomeQuery) {
  return useQuery({ queryKey: [...key, query], queryFn: () => incomeApi.list(query) });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateIncomeInput) => incomeApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateIncomeInput }) => incomeApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incomeApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
