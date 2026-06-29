import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { z } from 'zod';
import { type Task, type TaskPriority } from '@productivity/shared';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  RecurrenceFields,
  defaultRecurrence,
  toRecurrenceInput,
  type RecurrenceState,
} from '@/components/RecurrenceFields';
import { ApiError } from '@/lib/api-client';
import { todayISO } from '@/lib/format';
import { useCreateTask, useUpdateTask } from './hooks';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: z.string().optional(),
  reminderTime: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskDialog({
  open,
  onOpenChange,
  task,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
}) {
  const isEdit = !!task;
  const create = useCreateTask();
  const update = useUpdateTask();
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [telegram, setTelegram] = useState(false);
  const [alexa, setAlexa] = useState(false);
  const [recurrence, setRecurrence] = useState<RecurrenceState>(defaultRecurrence);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (open) {
      reset({
        title: task?.title ?? '',
        description: task?.description ?? '',
        notes: task?.notes ?? '',
        dueDate: task?.dueDate ?? '',
        reminderTime: task?.reminderTime ?? '',
      });
      setPriority(task?.priority ?? 'medium');
      setTelegram(task?.telegramEnabled ?? false);
      setAlexa(task?.alexaEnabled ?? false);
      setRecurrence(defaultRecurrence);
    }
  }, [open, task, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const dueDate = values.dueDate || undefined;
    const reminderTime = values.reminderTime || undefined;
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: task.id,
          input: {
            title: values.title,
            description: values.description || null,
            notes: values.notes || null,
            priority,
            dueDate: dueDate ?? null,
            reminderTime: reminderTime ?? null,
            telegramEnabled: telegram,
            alexaEnabled: alexa,
          },
        });
        toast.success('Task updated');
      } else {
        await create.mutateAsync({
          title: values.title,
          description: values.description || undefined,
          notes: values.notes || undefined,
          priority,
          status: 'pending',
          dueDate,
          reminderTime,
          telegramEnabled: telegram,
          alexaEnabled: alexa,
          recurrence: toRecurrenceInput(recurrence, dueDate ?? todayISO()),
        });
        toast.success('Task created');
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit task' : 'New task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input id="dueDate" type="date" {...register('dueDate')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder time</Label>
            <Input id="reminderTime" type="time" {...register('reminderTime')} />
          </div>
          {!isEdit && <RecurrenceFields value={recurrence} onChange={setRecurrence} />}
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="telegram">Telegram reminders</Label>
              <Switch id="telegram" checked={telegram} onCheckedChange={setTelegram} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="alexa">Alexa reminders</Label>
              <Switch id="alexa" checked={alexa} onCheckedChange={setAlexa} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
