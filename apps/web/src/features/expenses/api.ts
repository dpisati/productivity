import type {
  CreateExpenseInput,
  Expense,
  ListExpensesQuery,
  Paginated,
  UpdateExpenseInput,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const expensesApi = {
  list: (query: ListExpensesQuery) =>
    api.get<Paginated<Expense>>('/expenses', {
      page: query.page,
      pageSize: query.pageSize,
      from: query.from,
      to: query.to,
      categoryId: query.categoryId,
      status: query.status,
    }),
  create: (input: CreateExpenseInput) => api.post<Expense>('/expenses', input),
  update: (id: string, input: UpdateExpenseInput) => api.patch<Expense>(`/expenses/${id}`, input),
  remove: (id: string) => api.delete<void>(`/expenses/${id}`),
};
