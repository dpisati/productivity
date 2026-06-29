import { useState } from 'react';
import { CalendarClock, Pencil, Plus, Repeat, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Task, TaskPriority, TaskStatus } from '@productivity/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ApiError } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { OccurrencesDialog } from '@/features/tasks/OccurrencesDialog';
import { TaskDialog } from '@/features/tasks/TaskDialog';
import { useDeleteTask, useTaskList, useUpdateTask } from '@/features/tasks/hooks';

const priorityVariant: Record<TaskPriority, BadgeProps['variant']> = {
  low: 'secondary',
  medium: 'outline',
  high: 'warning',
  urgent: 'destructive',
};
const statusVariant: Record<TaskStatus, BadgeProps['variant']> = {
  pending: 'warning',
  in_progress: 'default',
  completed: 'success',
  cancelled: 'secondary',
};

export function TasksPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const { data, isLoading } = useTaskList({
    page,
    pageSize: 20,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [occTask, setOccTask] = useState<Task | null>(null);
  const [toDelete, setToDelete] = useState<Task | undefined>();

  const toggleComplete = async (t: Task) => {
    try {
      await update.mutateAsync({
        id: t.id,
        input: { status: t.status === 'completed' ? 'pending' : 'completed' },
      });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Task deleted');
      setToDelete(undefined);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader title="Tasks" description="Daily, monthly, and recurring to-dos" />
      <div className="mb-4 flex items-center justify-between gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Title</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!isLoading && data?.data.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No tasks yet.</TableCell></TableRow>
              )}
              {data?.data.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={t.status === 'completed'}
                      onChange={() => toggleComplete(t)}
                      aria-label="Toggle complete"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {t.title}
                      {t.isRecurring && <Repeat className="h-3 w-3 text-muted-foreground" />}
                      {t.telegramEnabled && <Send className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </TableCell>
                  <TableCell><Badge variant={priorityVariant[t.priority]}>{t.priority}</Badge></TableCell>
                  <TableCell><Badge variant={statusVariant[t.status]}>{t.status.replace('_', ' ')}</Badge></TableCell>
                  <TableCell>{t.dueDate ? formatDate(t.dueDate) : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setOccTask(t)} aria-label="Occurrences" title="Occurrences">
                      <CalendarClock className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(t)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {data && <Pagination meta={data.meta} onPage={setPage} />}

      <TaskDialog open={dialogOpen} onOpenChange={setDialogOpen} task={editing} />
      <OccurrencesDialog task={occTask} onOpenChange={(o) => !o && setOccTask(null)} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Delete task?"
        description={`“${toDelete?.title}” will be removed.`}
        onConfirm={confirmDelete}
        loading={del.isPending}
      />
    </div>
  );
}
