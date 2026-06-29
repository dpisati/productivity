import {
  cashflowQuery,
  cashflowResponse,
  dashboardSummary,
  dashboardSummaryQuery,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createDashboardService } from './dashboard.service.js';

const security = [{ bearerAuth: [] }];

export async function dashboardRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const svc = createDashboardService(app);
  r.addHook('onRequest', app.authenticate);

  r.get(
    '/summary',
    {
      schema: {
        tags: ['dashboard'],
        summary: 'Monthly financial summary',
        security,
        querystring: dashboardSummaryQuery,
        response: { 200: dashboardSummary },
      },
    },
    (req) => svc.summary(req.user!.id, req.query.month),
  );

  r.get(
    '/cashflow',
    {
      schema: {
        tags: ['dashboard'],
        summary: 'Historical cashflow with a next-month projection',
        security,
        querystring: cashflowQuery,
        response: { 200: cashflowResponse },
      },
    },
    (req) => svc.cashflow(req.user!.id, req.query.months),
  );
}
