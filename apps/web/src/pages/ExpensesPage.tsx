import { useState } from 'react';
import { Check, Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Expense, ExpenseStatus } from '@productivity/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import { ExpenseDialog } from '@/features/expenses/ExpenseDialog';
import { useDeleteExpense, useExpenseList, useUpdateExpense } from '@/features/expenses/hooks';

type StatusFilter = 'all' | 'unpaid' | 'paid';

export function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data, isLoading } = useExpenseList({
    page,
    pageSize: 20,
    status: statusFilter === 'all' ? undefined : (statusFilter as ExpenseStatus),
  });
  const update = useUpdateExpense();
  const del = useDeleteExpense();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | undefined>();
  const [toDelete, setToDelete] = useState<Expense | undefined>();

  const togglePaid = async (e: Expense) => {
    try {
      await update.mutateAsync({ id: e.id, input: { status: e.status === 'paid' ? 'unpaid' : 'paid' } });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Update failed');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Expense deleted');
      setToDelete(undefined);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader title="Expenses" description="Bills, subscriptions and spending" />
      <div className="mb-4 flex items-center justify-between gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as typeof statusFilter); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add expense
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!isLoading && data?.data.length === 0 && (
                <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No expenses found.</TableCell></TableRow>
              )}
              {data?.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.dueDate)}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {row.description ?? '—'}
                      {row.isRecurring && <Repeat className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </TableCell>
                  <TableCell>{row.category ? <Badge variant="secondary">{row.category.name}</Badge> : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'paid' ? 'success' : 'warning'}>{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(row.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => togglePaid(row)} aria-label="Toggle paid" title={row.status === 'paid' ? 'Mark unpaid' : 'Mark paid'}>
                      <Check className={row.status === 'paid' ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-muted-foreground'} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(row); setDialogOpen(true); }} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(row)} aria-label="Delete">
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

      <ExpenseDialog open={dialogOpen} onOpenChange={setDialogOpen} expense={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Delete expense?"
        onConfirm={confirmDelete}
        loading={del.isPending}
      />
    </div>
  );
}
