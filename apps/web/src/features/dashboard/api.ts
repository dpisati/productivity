import type { CashflowResponse, DashboardSummary } from '@productivity/shared';
import { api } from '@/lib/api-client';

export const dashboardApi = {
  summary: (month?: string) => api.get<DashboardSummary>('/dashboard/summary', { month }),
  cashflow: (months = 6) => api.get<CashflowResponse>('/dashboard/cashflow', { months }),
};
