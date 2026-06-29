import { eq } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type { UpdateSettingsInput, UserSettings } from '@productivity/shared';
import type { FastifyInstance } from 'fastify';

type SettingsRow = typeof schema.userSettings.$inferSelect;

function mapSettings(row: SettingsRow): UserSettings {
  return {
    timezone: row.timezone,
    currency: row.currency,
    locale: row.locale,
    theme: row.theme as UserSettings['theme'],
    defaultReminderTime: row.defaultReminderTime.slice(0, 5),
  };
}

export function createSettingsService(app: FastifyInstance) {
  const { db } = app;
  const s = schema.userSettings;

  /** Return the user's settings, lazily creating defaults if missing. */
  async function getOrCreate(userId: string): Promise<SettingsRow> {
    const existing = await db.query.userSettings.findFirst({ where: eq(s.userId, userId) });
    if (existing) return existing;
    const [created] = await db.insert(s).values({ userId }).returning();
    return created!;
  }

  return {
    async get(userId: string): Promise<UserSettings> {
      return mapSettings(await getOrCreate(userId));
    },

    async update(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
      await getOrCreate(userId);
      const [row] = await db
        .update(s)
        .set({
          ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
          ...(input.currency !== undefined ? { currency: input.currency } : {}),
          ...(input.locale !== undefined ? { locale: input.locale } : {}),
          ...(input.theme !== undefined ? { theme: input.theme } : {}),
          ...(input.defaultReminderTime !== undefined
            ? { defaultReminderTime: input.defaultReminderTime }
            : {}),
        })
        .where(eq(s.userId, userId))
        .returning();
      return mapSettings(row!);
    },
  };
}
