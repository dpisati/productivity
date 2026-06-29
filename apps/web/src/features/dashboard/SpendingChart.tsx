import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { CategorySpend } from '@productivity/shared';

const PALETTE = ['#3b82f6', '#ef4444', '#f59e0b', '#84cc16', '#a855f7', '#06b6d4', '#ec4899', '#14b8a6'];

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No spending this month.</p>;
  }
  const chartData = data.map((d) => ({ name: d.name, value: Number(d.total), color: d.color }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
          {chartData.map((entry, i) => (
            <Cell key={entry.name} fill={entry.color ?? PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
