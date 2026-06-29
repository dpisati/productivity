import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { formatDate, formatMoney } from '@/lib/format';
import { useAuthStore } from '@/stores/auth';
import { dashboardApi } from '@/features/dashboard/api';
import { CashflowChart } from '@/features/dashboard/CashflowChart';
import { SpendingChart } from '@/features/dashboard/SpendingChart';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const summary = useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => dashboardApi.summary() });
  const cashflow = useQuery({ queryKey: ['dashboard', 'cashflow'], queryFn: () => dashboardApi.cashflow(6) });
  const data = summary.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome${user ? `, ${user.name}` : ''}`}
        description="Here’s your current month at a glance"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Income" value={data ? formatMoney(data.income) : '—'} icon={<ArrowUpRight className="h-4 w-4 text-green-500" />} />
        <StatCard label="Expenses" value={data ? formatMoney(data.expenses) : '—'} icon={<ArrowDownRight className="h-4 w-4 text-destructive" />} />
        <StatCard label={`Net (savings ${data?.savingsRate ?? 0}%)`} value={data ? formatMoney(data.net) : '—'} icon={<PiggyBank className="h-4 w-4 text-primary" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Income vs Expenses</CardTitle></CardHeader>
          <CardContent>
            {cashflow.data ? <CashflowChart points={cashflow.data.points} /> : <ChartSkeleton />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Spending by category</CardTitle></CardHeader>
          <CardContent>
            {data ? <SpendingChart data={data.spendingByCategory} /> : <ChartSkeleton />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming bills</CardTitle></CardHeader>
        <CardContent>
          {!data || data.upcomingBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming bills. 🎉</p>
          ) : (
            <ul className="divide-y">
              {data.upcomingBills.map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{b.description ?? 'Bill'}</p>
                    <p className="text-xs text-muted-foreground">Due {formatDate(b.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="warning">{b.status}</Badge>
                    <span className="font-medium">{formatMoney(b.amount)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return <div className="h-[260px] animate-pulse rounded-md bg-muted" />;
}
