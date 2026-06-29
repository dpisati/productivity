import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from './api';

const key = ['notifications'];

export function useNotifications(page: number, unread?: boolean) {
  return useQuery({
    queryKey: [...key, { page, unread }],
    queryFn: () => notificationsApi.list({ page, pageSize: 20, unread }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...key, 'unread-count'],
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });
}
