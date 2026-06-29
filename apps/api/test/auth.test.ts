import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, schema } from '@productivity/db';
import type { FastifyInstance } from 'fastify';
import { signEmailVerifyToken, signPasswordResetToken } from '../src/lib/tokens.js';
import { authHeader, makeApp, registerUser, resetDb } from './helpers.js';

describe('auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await makeApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await resetDb();
  });

  it('registers a new user and returns tokens', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'alice@test.dev', password: 'Password123!', name: 'Alice' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user).toMatchObject({ email: 'alice@test.dev', name: 'Alice', role: 'user' });
    expect(body.user.emailVerified).toBe(false);
    expect(body.tokens.accessToken).toBeTypeOf('string');
    expect(body.tokens.refreshToken).toBeTypeOf('string');
    expect(body.tokens.tokenType).toBe('Bearer');

    // user_settings row was created in the same transaction
    const settings = await db.query.userSettings.findFirst({
      where: eq(schema.userSettings.userId, body.user.id),
    });
    expect(settings).toBeTruthy();
  });

  it('rejects duplicate registration with 409', async () => {
    await registerUser(app, { email: 'dup@test.dev' });
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'dup@test.dev', password: 'Password123!', name: 'Dup' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('CONFLICT');
  });

  it('rejects invalid input with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'short', name: '' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with correct credentials and rejects wrong password', async () => {
    const { email, password } = await registerUser(app, { email: 'bob@test.dev' });

    const ok = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().tokens.accessToken).toBeTypeOf('string');

    const bad = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'WrongPassword1!' },
    });
    expect(bad.statusCode).toBe(401);
  });

  it('returns the current user from /me and guards it', async () => {
    const { accessToken, userId, email } = await registerUser(app, { email: 'carol@test.dev' });

    const me = await app.inject({ method: 'GET', url: '/api/users/me', headers: authHeader(accessToken) });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toMatchObject({ id: userId, email });

    const noAuth = await app.inject({ method: 'GET', url: '/api/users/me' });
    expect(noAuth.statusCode).toBe(401);

    const badAuth = await app.inject({
      method: 'GET',
      url: '/api/users/me',
      headers: authHeader('garbage.token.value'),
    });
    expect(badAuth.statusCode).toBe(401);
  });

  it('refreshes tokens and rejects an invalid refresh token', async () => {
    const { refreshToken } = await registerUser(app, { email: 'dave@test.dev' });

    const ok = await app.inject({ method: 'POST', url: '/api/auth/refresh', payload: { refreshToken } });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().tokens.accessToken).toBeTypeOf('string');

    const bad = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'nope' },
    });
    expect(bad.statusCode).toBe(401);
  });

  it('verifies email via token', async () => {
    const { userId, accessToken } = await registerUser(app, { email: 'erin@test.dev' });
    const token = signEmailVerifyToken(userId);

    const res = await app.inject({ method: 'POST', url: '/api/auth/verify-email', payload: { token } });
    expect(res.statusCode).toBe(200);

    const me = await app.inject({ method: 'GET', url: '/api/users/me', headers: authHeader(accessToken) });
    expect(me.json().emailVerified).toBe(true);
  });

  it('resets password and invalidates the old one', async () => {
    const { email } = await registerUser(app, { email: 'frank@test.dev' });

    // forgot-password always returns a generic 200
    const forgot = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email },
    });
    expect(forgot.statusCode).toBe(200);

    // forge the reset token from the user's current hash (as the email link would carry)
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    const token = signPasswordResetToken(user!.id, user!.passwordHash);

    const reset = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token, password: 'NewPassword456!' },
    });
    expect(reset.statusCode).toBe(200);

    const newLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'NewPassword456!' },
    });
    expect(newLogin.statusCode).toBe(200);

    const oldLogin = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'Password123!' },
    });
    expect(oldLogin.statusCode).toBe(401);

    // the now-stale reset token must fail (hash changed)
    const reuse = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token, password: 'Another789!' },
    });
    expect(reuse.statusCode).toBe(401);
  });
});
