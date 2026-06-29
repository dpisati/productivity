import { useState } from 'react';
import { BellOff, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { formatDate } from '@/lib/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/features/notifications/hooks';

export function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  return (
    <div>
      <PageHeader title="Notifications" description="Reminders and account activity" />
      <div className="mb-4 flex justify-end">
        <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading && <p className="p-6 text-sm text-muted-foreground">Loading…</p>}
          {!isLoading && data?.data.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <BellOff className="h-6 w-6" />
              <p className="text-sm">No notifications.</p>
            </div>
          )}
          <ul className="divide-y">
            {data?.data.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-3 p-4', !n.readAt && 'bg-primary/5')}>
                <div className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.readAt ? 'bg-muted' : 'bg-primary')} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
                {!n.readAt && (
                  <Button variant="ghost" size="icon" onClick={() => markRead.mutate(n.id)} aria-label="Mark read">
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {data && <Pagination meta={data.meta} onPage={setPage} />}
    </div>
  );
}
