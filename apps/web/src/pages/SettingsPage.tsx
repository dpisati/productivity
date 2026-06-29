import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ThemePreference, UpdateSettingsInput } from '@productivity/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/PageHeader';
import { ApiError } from '@/lib/api-client';
import { useThemeStore } from '@/stores/theme';
import { useSettings, useUpdateSettings } from '@/features/settings/hooks';

export function SettingsPage() {
  const { data, isLoading } = useSettings();
  const update = useUpdateSettings();
  const setTheme = useThemeStore((s) => s.setTheme);
  const [form, setForm] = useState<UpdateSettingsInput>({});

  useEffect(() => {
    if (data) {
      setForm({
        timezone: data.timezone,
        currency: data.currency,
        locale: data.locale,
        theme: data.theme,
        defaultReminderTime: data.defaultReminderTime,
      });
    }
  }, [data]);

  const onSave = async () => {
    try {
      await update.mutateAsync(form);
      if (form.theme) setTheme(form.theme);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Save failed');
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" description="Preferences and localization" />
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                value={form.currency ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Locale</Label>
              <Input
                id="locale"
                value={form.locale ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, locale: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={form.timezone ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder">Default reminder time</Label>
              <Input
                id="reminder"
                type="time"
                value={form.defaultReminderTime ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, defaultReminderTime: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={form.theme ?? 'system'}
                onValueChange={(v) => setForm((f) => ({ ...f, theme: v as ThemePreference }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
