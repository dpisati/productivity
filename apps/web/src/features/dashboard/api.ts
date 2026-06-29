import type { DashboardSummary } from '@productivity/shared';
import { api } from '@/lib/api-client';

export const dashboardApi = {
  summary: (month?: string) => api.get<DashboardSummary>('/dashboard/summary', { month }),
};
