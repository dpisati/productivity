import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowDownRight, ArrowUpRight, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { useAuthStore } from '@/stores/auth';
import { dashboardApi } from '@/features/dashboard/api';

function money(v: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(v));
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.summary(),
  });

  return (
    <div>
      <PageHeader
        title={`Welcome${user ? `, ${user.name}` : ''}`}
        description="Here’s your current month at a glance"
      />

      {isError && <p className="text-sm text-destructive">Failed to load summary.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Income"
          value={isLoading || !data ? '—' : money(data.income)}
          icon={<ArrowUpRight className="h-4 w-4 text-green-500" />}
        />
        <StatCard
          label="Expenses"
          value={isLoading || !data ? '—' : money(data.expenses)}
          icon={<ArrowDownRight className="h-4 w-4 text-destructive" />}
        />
        <StatCard
          label={`Net (savings ${data ? data.savingsRate : 0}%)`}
          value={isLoading || !data ? '—' : money(data.net)}
          icon={<PiggyBank className="h-4 w-4 text-primary" />}
        />
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Charts, calendar, and full module pages arrive in the next milestone.
      </p>
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
