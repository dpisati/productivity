import { and, eq, isNull } from 'drizzle-orm';
import { schema } from '@productivity/db';
import type {
  AuthResponse,
  AuthTokens,
  LoginInput,
  PublicUser,
  RegisterInput,
} from '@productivity/shared';
import type { FastifyInstance } from 'fastify';
import { ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { hashPassword, verifyPassword } from '../../lib/password.js';
import { writeAudit } from '../../lib/audit.js';
import { env } from '../../config/env.js';
import {
  peekSubject,
  signAccessToken,
  signEmailVerifyToken,
  signPasswordResetToken,
  signRefreshToken,
  verifyEmailVerifyToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from '../../lib/tokens.js';

type UserRow = typeof schema.users.$inferSelect;

function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
  };
}

function buildTokens(u: UserRow): AuthTokens {
  const access = signAccessToken({ id: u.id, role: u.role, email: u.email });
  const refresh = signRefreshToken(u.id);
  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    tokenType: 'Bearer',
    expiresIn: access.expiresIn,
  };
}

export function createAuthService(app: FastifyInstance) {
  const { db, mailer, log } = app;

  async function findActiveByEmail(email: string) {
    return db.query.users.findFirst({
      where: and(eq(schema.users.email, email), isNull(schema.users.deletedAt)),
    });
  }

  return {
    async register(input: RegisterInput): Promise<AuthResponse> {
      const existing = await findActiveByEmail(input.email);
      if (existing) throw new ConflictError('An account with this email already exists');

      const passwordHash = await hashPassword(input.password);
      const user = await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(schema.users)
          .values({ email: input.email, passwordHash, name: input.name })
          .returning();
        if (!created) throw new Error('failed to create user');
        await tx.insert(schema.userSettings).values({ userId: created.id });
        return created;
      });

      const verifyToken = signEmailVerifyToken(user.id);
      await mailer.send({
        to: user.email,
        subject: 'Verify your email',
        text: `Welcome! Confirm your email:\n${env.APP_URL}/verify-email?token=${verifyToken}`,
      });
      await writeAudit(db, { userId: user.id, action: 'auth.register', entity: 'user', entityId: user.id });

      return { user: toPublicUser(user), tokens: buildTokens(user) };
    },

    async login(input: LoginInput): Promise<AuthResponse> {
      const user = await findActiveByEmail(input.email);
      if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
        throw new UnauthorizedError('Invalid email or password');
      }
      await writeAudit(db, { userId: user.id, action: 'auth.login', entity: 'user', entityId: user.id });
      return { user: toPublicUser(user), tokens: buildTokens(user) };
    },

    async refresh(refreshToken: string): Promise<AuthTokens> {
      const { sub } = verifyRefreshToken(refreshToken);
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.id, sub), isNull(schema.users.deletedAt)),
      });
      if (!user) throw new UnauthorizedError('Account no longer exists');
      return buildTokens(user);
    },

    /** Always resolves with a generic message to avoid leaking which emails exist. */
    async forgotPassword(email: string): Promise<void> {
      const user = await findActiveByEmail(email);
      if (!user) return;
      const token = signPasswordResetToken(user.id, user.passwordHash);
      await mailer.send({
        to: user.email,
        subject: 'Reset your password',
        text: `Reset your password:\n${env.APP_URL}/reset-password?token=${token}`,
      });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      const sub = peekSubject(token);
      if (!sub) throw new UnauthorizedError('Invalid reset token');
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.id, sub), isNull(schema.users.deletedAt)),
      });
      if (!user) throw new UnauthorizedError('Invalid reset token');

      verifyPasswordResetToken(token, user.passwordHash); // throws if invalid
      const passwordHash = await hashPassword(newPassword);
      await db
        .update(schema.users)
        .set({ passwordHash })
        .where(eq(schema.users.id, user.id));
      await writeAudit(db, {
        userId: user.id,
        action: 'auth.password_reset',
        entity: 'user',
        entityId: user.id,
      });
    },

    async verifyEmail(token: string): Promise<void> {
      const sub = verifyEmailVerifyToken(token);
      await db.update(schema.users).set({ emailVerified: true }).where(eq(schema.users.id, sub));
      log.info({ userId: sub }, 'email verified');
    },

    async getById(id: string): Promise<PublicUser | null> {
      const user = await db.query.users.findFirst({
        where: and(eq(schema.users.id, id), isNull(schema.users.deletedAt)),
      });
      return user ? toPublicUser(user) : null;
    },
  };
}

export type AuthService = ReturnType<typeof createAuthService>;
