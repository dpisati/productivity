import {
  accessTokenResponse,
  authResponse,
  forgotPasswordInput,
  loginInput,
  messageResponse,
  refreshInput,
  registerInput,
  resetPasswordInput,
  verifyEmailInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createAuthService } from './auth.service.js';

export async function authRoutes(app: FastifyInstance) {
  const r = app.withTypeProvider<ZodTypeProvider>();
  const auth = createAuthService(app);

  r.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a new account',
        body: registerInput,
        response: { 201: authResponse },
      },
    },
    async (request, reply) => {
      const result = await auth.register(request.body);
      return reply.status(201).send(result);
    },
  );

  r.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Authenticate and receive tokens',
        body: loginInput,
        response: { 200: authResponse },
      },
    },
    (request) => auth.login(request.body),
  );

  r.post(
    '/refresh',
    {
      schema: {
        tags: ['auth'],
        summary: 'Exchange a refresh token for new tokens',
        body: refreshInput,
        response: { 200: accessTokenResponse },
      },
    },
    async (request) => ({ tokens: await auth.refresh(request.body.refreshToken) }),
  );

  r.post(
    '/forgot-password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Request a password reset email',
        body: forgotPasswordInput,
        response: { 200: messageResponse },
      },
    },
    async (request) => {
      await auth.forgotPassword(request.body.email);
      return { message: 'If an account exists for that email, a reset link has been sent.' };
    },
  );

  r.post(
    '/reset-password',
    {
      schema: {
        tags: ['auth'],
        summary: 'Reset password using a reset token',
        body: resetPasswordInput,
        response: { 200: messageResponse },
      },
    },
    async (request) => {
      await auth.resetPassword(request.body.token, request.body.password);
      return { message: 'Password updated. You can now sign in.' };
    },
  );

  r.post(
    '/verify-email',
    {
      schema: {
        tags: ['auth'],
        summary: 'Verify email using a verification token',
        body: verifyEmailInput,
        response: { 200: messageResponse },
      },
    },
    async (request) => {
      await auth.verifyEmail(request.body.token);
      return { message: 'Email verified.' };
    },
  );
}
