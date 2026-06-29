import type { RecurrenceFrequency, RecurrenceInput } from '@productivity/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export interface RecurrenceState {
  enabled: boolean;
  frequency: RecurrenceFrequency;
  interval: number;
}

export const defaultRecurrence: RecurrenceState = {
  enabled: false,
  frequency: 'monthly',
  interval: 1,
};

/** Convert UI recurrence state into a RecurrenceInput payload (or undefined). */
export function toRecurrenceInput(state: RecurrenceState, startDate: string): RecurrenceInput | undefined {
  if (!state.enabled) return undefined;
  return { frequency: state.frequency, interval: state.interval, startDate };
}

const FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly', 'yearly'];

export function RecurrenceFields({
  value,
  onChange,
}: {
  value: RecurrenceState;
  onChange: (next: RecurrenceState) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex items-center justify-between">
        <Label htmlFor="recurring">Recurring</Label>
        <Switch
          id="recurring"
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ ...value, enabled })}
        />
      </div>
      {value.enabled && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={value.frequency}
              onValueChange={(v) => onChange({ ...value, frequency: v as RecurrenceFrequency })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Every</Label>
            <Input
              type="number"
              min={1}
              value={value.interval}
              onChange={(e) => onChange({ ...value, interval: Math.max(1, Number(e.target.value)) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
