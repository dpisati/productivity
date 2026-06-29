import { useState } from 'react';
import { Pencil, Plus, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Income } from '@productivity/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { ApiError } from '@/lib/api-client';
import { formatDate, formatMoney } from '@/lib/format';
import { IncomeDialog } from '@/features/income/IncomeDialog';
import { useDeleteIncome, useIncomeList } from '@/features/income/hooks';

export function IncomePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useIncomeList({ page, pageSize: 20 });
  const del = useDeleteIncome();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Income | undefined>();
  const [toDelete, setToDelete] = useState<Income | undefined>();

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success('Income deleted');
      setToDelete(undefined);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <PageHeader title="Income" description="Salary and other income sources" />
      <div className="mb-4 flex justify-end">
        <Button onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Add income
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading…</TableCell></TableRow>
              )}
              {!isLoading && data?.data.length === 0 && (
                <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No income recorded.</TableCell></TableRow>
              )}
              {data?.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-2">
                      {row.description ?? '—'}
                      {row.isRecurring && <Repeat className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </TableCell>
                  <TableCell>{row.category ? <Badge variant="secondary">{row.category.name}</Badge> : '—'}</TableCell>
                  <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                    {formatMoney(row.amount)}
                  </TableCell>
                  <TableCell className="text-right">
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

      <IncomeDialog open={dialogOpen} onOpenChange={setDialogOpen} income={editing} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title="Delete income?"
        onConfirm={confirmDelete}
        loading={del.isPending}
      />
    </div>
  );
}
