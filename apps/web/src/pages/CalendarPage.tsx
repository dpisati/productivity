import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { formatMoney } from '@/lib/format';
import { useExpenseList } from '@/features/expenses/hooks';
import { useIncomeList } from '@/features/income/hooks';
import { useTaskList } from '@/features/tasks/hooks';

const iso = (d: Date) => format(d, 'yyyy-MM-dd');

interface DayItem {
  key: string;
  label: string;
  tone: 'income' | 'expense' | 'task';
}

export function CalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const from = iso(monthStart);
  const to = iso(monthEnd);

  const income = useIncomeList({ page: 1, pageSize: 100, from, to });
  const expenses = useExpenseList({ page: 1, pageSize: 100, from, to });
  const tasks = useTaskList({ page: 1, pageSize: 100, from, to });

  const itemsByDay = useMemo(() => {
    const map = new Map<string, DayItem[]>();
    const push = (date: string, item: DayItem) => {
      const list = map.get(date) ?? [];
      list.push(item);
      map.set(date, list);
    };
    income.data?.data.forEach((i) =>
      push(i.date, { key: `i-${i.id}`, label: `+${formatMoney(i.amount)}`, tone: 'income' }),
    );
    expenses.data?.data.forEach((e) =>
      push(e.dueDate, { key: `e-${e.id}`, label: `-${formatMoney(e.amount)}`, tone: 'expense' }),
    );
    tasks.data?.data.forEach((t) => {
      if (t.dueDate) push(t.dueDate, { key: `t-${t.id}`, label: t.title, tone: 'task' });
    });
    return map;
  }, [income.data, expenses.data, tasks.data]);

  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(monthStart, { weekStartsOn: 0 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
      }),
    [monthStart, monthEnd],
  );

  const toneClass: Record<DayItem['tone'], string> = {
    income: 'bg-green-500/15 text-green-700 dark:text-green-400',
    expense: 'bg-destructive/15 text-destructive',
    task: 'bg-primary/15 text-primary',
  };

  return (
    <div>
      <PageHeader title="Calendar" description="Bills, income and tasks in one view" />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{format(cursor, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, -1))} aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCursor(addMonths(cursor, 1))} aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const key = iso(day);
              const items = itemsByDay.get(key) ?? [];
              const inMonth = isSameMonth(day, cursor);
              const today = isSameDay(day, new Date());
              return (
                <div
                  key={key}
                  className={cn(
                    'min-h-24 rounded-md border p-1 text-left',
                    !inMonth && 'bg-muted/30 text-muted-foreground',
                  )}
                >
                  <div className={cn('mb-1 text-xs', today && 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground')}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {items.slice(0, 3).map((it) => (
                      <div key={it.key} className={cn('truncate rounded px-1 py-0.5 text-[10px]', toneClass[it.tone])}>
                        {it.label}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{items.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
