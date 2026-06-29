import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createIncomeInput, type CreateIncomeInput, type Income } from '@productivity/shared';
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
import { useCreateIncome, useUpdateIncome } from './hooks';

type FormValues = Pick<CreateIncomeInput, 'amount' | 'date' | 'categoryId' | 'description'>;

export function IncomeDialog({
  open,
  onOpenChange,
  income,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: Income;
}) {
  const isEdit = !!income;
  const create = useCreateIncome();
  const update = useUpdateIncome();
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [recurrence, setRecurrence] = useState<RecurrenceState>(defaultRecurrence);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(createIncomeInput.pick({ amount: true, date: true, description: true })) });

  useEffect(() => {
    if (open) {
      reset({ amount: income?.amount ?? '', date: income?.date ?? todayISO(), description: income?.description ?? '' });
      setCategoryId(income?.categoryId ?? undefined);
      setRecurrence(defaultRecurrence);
    }
  }, [open, income, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: income.id,
          input: { amount: values.amount, date: values.date, description: values.description || null, categoryId: categoryId ?? null },
        });
        toast.success('Income updated');
      } else {
        await create.mutateAsync({
          amount: values.amount,
          date: values.date,
          description: values.description || undefined,
          categoryId,
          recurrence: toRecurrenceInput(recurrence, values.date),
        });
        toast.success('Income added');
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
          <DialogTitle>{isEdit ? 'Edit income' : 'Add income'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" inputMode="decimal" placeholder="0.00" {...register('amount')} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <CategorySelect type="income" value={categoryId} onChange={setCategoryId} />
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
