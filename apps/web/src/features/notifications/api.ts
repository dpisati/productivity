import type {
  ListNotificationsQuery,
  Notification,
  Paginated,
  UnreadCountResponse,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const notificationsApi = {
  list: (query: { page?: number; pageSize?: number; unread?: boolean }) =>
    api.get<Paginated<Notification>>('/notifications', {
      page: query.page,
      pageSize: query.pageSize,
      unread: query.unread === undefined ? undefined : String(query.unread),
    }),
  unreadCount: () => api.get<UnreadCountResponse>('/notifications/unread-count'),
  markRead: (id: string) => api.post<Notification>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>('/notifications/read-all'),
};

export type { ListNotificationsQuery };
