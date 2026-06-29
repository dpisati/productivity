import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createExpenseInput, type CreateExpenseInput, type Expense } from '@productivity/shared';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CategorySelect } from '@/components/CategorySelect';
import {
  RecurrenceFields,
  defaultRecurrence,
  toRecurrenceInput,
  type RecurrenceState,
} from '@/components/RecurrenceFields';
import { ApiError } from '@/lib/api-client';
import { todayISO } from '@/lib/format';
import { useCreateExpense, useUpdateExpense } from './hooks';

type FormValues = Pick<CreateExpenseInput, 'amount' | 'dueDate' | 'description'>;

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense?: Expense;
}) {
  const isEdit = !!expense;
  const create = useCreateExpense();
  const update = useUpdateExpense();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [status, setStatus] = useState<'paid' | 'unpaid'>('unpaid');
  const [recurrence, setRecurrence] = useState<RecurrenceState>(defaultRecurrence);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createExpenseInput.pick({ amount: true, dueDate: true, description: true })),
  });

  useEffect(() => {
    if (open) {
      reset({ amount: expense?.amount ?? '', dueDate: expense?.dueDate ?? todayISO(), description: expense?.description ?? '' });
      setCategoryId(expense?.categoryId ?? undefined);
      setStatus(expense?.status ?? 'unpaid');
      setRecurrence(defaultRecurrence);
    }
  }, [open, expense, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: expense.id,
          input: { amount: values.amount, dueDate: values.dueDate, description: values.description || null, categoryId: categoryId ?? null, status },
        });
        toast.success('Expense updated');
      } else {
        await create.mutateAsync({
          amount: values.amount,
          dueDate: values.dueDate,
          description: values.description || undefined,
          categoryId,
          status,
          recurrence: toRecurrenceInput(recurrence, values.dueDate),
        });
        toast.success('Expense added');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <CategorySelect type="expense" value={categoryId} onChange={setCategoryId} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as 'paid' | 'unpaid')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          {!isEdit && <RecurrenceFields value={recurrence} onChange={setRecurrence} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Save' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
