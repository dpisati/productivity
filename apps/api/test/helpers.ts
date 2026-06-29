import { sql } from '@productivity/db';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';

/** Remove all rows from app tables (FK-safe via CASCADE) for an isolated test. */
export async function resetDb(): Promise<void> {
  await sql`TRUNCATE TABLE
    audit_logs, notifications, reminders, task_occurrences, tasks,
    expenses, income, recurring_rules, categories,
    alexa_accounts, telegram_accounts, user_settings, users
    RESTART IDENTITY CASCADE`;
}

export async function makeApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

interface RegisteredUser {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  password: string;
}

/** Register a fresh user and return its tokens. */
export async function registerUser(
  app: FastifyInstance,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
): Promise<RegisteredUser> {
  const email = overrides.email ?? `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.dev`;
  const password = overrides.password ?? 'Password123!';
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password, name: overrides.name ?? 'Test User' },
  });
  if (res.statusCode !== 201) {
    throw new Error(`registerUser failed (${res.statusCode}): ${res.body}`);
  }
  const body = res.json() as { user: { id: string }; tokens: { accessToken: string; refreshToken: string } };
  return {
    accessToken: body.tokens.accessToken,
    refreshToken: body.tokens.refreshToken,
    userId: body.user.id,
    email,
    password,
  };
}

export function authHeader(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}
