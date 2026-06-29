import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTaskInput,
  ListTasksQuery,
  UpdateOccurrenceInput,
  UpdateTaskInput,
} from '@productivity/shared';
import { tasksApi } from './api';

const key = ['tasks'];

export function useTaskList(query: ListTasksQuery) {
  return useQuery({ queryKey: [...key, query], queryFn: () => tasksApi.list(query) });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => tasksApi.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => tasksApi.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useTaskOccurrences(taskId: string | null) {
  return useQuery({
    queryKey: [...key, taskId, 'occurrences'],
    queryFn: () => tasksApi.occurrences(taskId!),
    enabled: !!taskId,
  });
}

export function useUpdateOccurrence(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ occId, input }: { occId: string; input: UpdateOccurrenceInput }) =>
      tasksApi.updateOccurrence(taskId, occId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...key, taskId, 'occurrences'] }),
  });
}
