import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { authHeader, makeApp, registerUser, resetDb } from './helpers.js';

describe('user settings', () => {
  let app: FastifyInstance;
  let auth: Record<string, string>;

  beforeAll(async () => {
    app = await makeApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
    auth = authHeader((await registerUser(app)).accessToken);
  });

  it('returns defaults then persists updates', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/users/settings', headers: auth });
    expect(initial.statusCode).toBe(200);
    expect(initial.json()).toMatchObject({ currency: 'USD', theme: 'system' });

    const upd = await app.inject({
      method: 'PATCH',
      url: '/api/users/settings',
      headers: auth,
      payload: { currency: 'EUR', theme: 'dark', defaultReminderTime: '07:30' },
    });
    expect(upd.statusCode).toBe(200);
    expect(upd.json()).toMatchObject({ currency: 'EUR', theme: 'dark', defaultReminderTime: '07:30' });

    const after = await app.inject({ method: 'GET', url: '/api/users/settings', headers: auth });
    expect(after.json().currency).toBe('EUR');
  });
});
