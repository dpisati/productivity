import { z } from 'zod';
import { currencyCode, timeOfDay } from '../common/primitives.js';

export const themePreference = z.enum(['light', 'dark', 'system']);
export type ThemePreference = z.infer<typeof themePreference>;

export const userSettings = z.object({
  timezone: z.string(),
  currency: z.string(),
  locale: z.string(),
  theme: themePreference,
  defaultReminderTime: timeOfDay,
});
export type UserSettings = z.infer<typeof userSettings>;

export const updateSettingsInput = z.object({
  timezone: z.string().min(1).max(64).optional(),
  currency: currencyCode.optional(),
  locale: z.string().min(2).max(10).optional(),
  theme: themePreference.optional(),
  defaultReminderTime: timeOfDay.optional(),
});
export type UpdateSettingsInput = z.infer<typeof updateSettingsInput>;
