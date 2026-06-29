import type { UpdateSettingsInput, UserSettings } from '@productivity/shared';
import { api } from '@/lib/api-client';

export const settingsApi = {
  get: () => api.get<UserSettings>('/users/settings'),
  update: (input: UpdateSettingsInput) => api.patch<UserSettings>('/users/settings', input),
};
