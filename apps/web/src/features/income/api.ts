import type {
  CreateIncomeInput,
  Income,
  ListIncomeQuery,
  Paginated,
  UpdateIncomeInput,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const incomeApi = {
  list: (query: ListIncomeQuery) =>
    api.get<Paginated<Income>>('/income', {
      page: query.page,
      pageSize: query.pageSize,
      from: query.from,
      to: query.to,
      categoryId: query.categoryId,
    }),
  create: (input: CreateIncomeInput) => api.post<Income>('/income', input),
  update: (id: string, input: UpdateIncomeInput) => api.patch<Income>(`/income/${id}`, input),
  remove: (id: string) => api.delete<void>(`/income/${id}`),
};
