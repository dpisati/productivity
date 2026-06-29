import type {
  CreateTaskInput,
  ListTasksQuery,
  Paginated,
  Task,
  TaskOccurrence,
  UpdateOccurrenceInput,
  UpdateTaskInput,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const tasksApi = {
  list: (query: ListTasksQuery) =>
    api.get<Paginated<Task>>('/tasks', {
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      priority: query.priority,
      categoryId: query.categoryId,
      from: query.from,
      to: query.to,
    }),
  create: (input: CreateTaskInput) => api.post<Task>('/tasks', input),
  update: (id: string, input: UpdateTaskInput) => api.patch<Task>(`/tasks/${id}`, input),
  remove: (id: string) => api.delete<void>(`/tasks/${id}`),
  occurrences: (taskId: string) => api.get<TaskOccurrence[]>(`/tasks/${taskId}/occurrences`),
  updateOccurrence: (taskId: string, occId: string, input: UpdateOccurrenceInput) =>
    api.patch<TaskOccurrence>(`/tasks/${taskId}/occurrences/${occId}`, input),
};
