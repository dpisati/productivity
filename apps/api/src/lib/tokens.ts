import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { UnauthorizedError } from './errors.js';
import type { UserRole } from '@productivity/shared';

export interface AccessClaims {
  sub: string;
  role: UserRole;
  email: string;
  typ: 'access';
}

interface RefreshClaims {
  sub: string;
  typ: 'refresh';
}

/** Secrets are namespaced per token purpose so a token of one type can never
 * be replayed as another. Reset tokens additionally mix in the current
 * password hash, making them single-use (changing the password invalidates
 * any outstanding reset token). */
const verifySecret = `${env.JWT_ACCESS_SECRET}:verify`;
const resetSecret = (passwordHash: string) => `${env.JWT_ACCESS_SECRET}:reset:${passwordHash}`;

function signFor(payload: object, secret: string, expiresIn: string): { token: string; expiresIn: number } {
  const token = jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  const decoded = jwt.decode(token) as JwtPayload;
  const seconds = (decoded.exp ?? 0) - (decoded.iat ?? 0);
  return { token, expiresIn: seconds };
}

export function signAccessToken(user: { id: string; role: UserRole; email: string }) {
  return signFor(
    { sub: user.id, role: user.role, email: user.email, typ: 'access' },
    env.JWT_ACCESS_SECRET,
    env.ACCESS_TOKEN_TTL,
  );
}

export function signRefreshToken(userId: string) {
  return signFor({ sub: userId, typ: 'refresh' }, env.JWT_REFRESH_SECRET, env.REFRESH_TOKEN_TTL);
}

export function signEmailVerifyToken(userId: string) {
  return signFor({ sub: userId, typ: 'verify' }, verifySecret, env.EMAIL_VERIFY_TTL).token;
}

export function signPasswordResetToken(userId: string, passwordHash: string) {
  return signFor({ sub: userId, typ: 'reset' }, resetSecret(passwordHash), env.PASSWORD_RESET_TTL)
    .token;
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const c = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessClaims;
    if (c.typ !== 'access') throw new Error('wrong type');
    return c;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): RefreshClaims {
  try {
    const c = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshClaims;
    if (c.typ !== 'refresh') throw new Error('wrong type');
    return c;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
}

export function verifyEmailVerifyToken(token: string): string {
  try {
    const c = jwt.verify(token, verifySecret) as JwtPayload & { typ?: string };
    if (c.typ !== 'verify' || !c.sub) throw new Error('wrong type');
    return c.sub;
  } catch {
    throw new UnauthorizedError('Invalid or expired verification token');
  }
}

/** Read the `sub` claim without verifying the signature. Used to locate the
 * user for a password-reset token before verifying against their hash. */
export function peekSubject(token: string): string | null {
  const decoded = jwt.decode(token) as JwtPayload | null;
  return typeof decoded?.sub === 'string' ? decoded.sub : null;
}

/** Verify a reset token against the user's *current* password hash. */
export function verifyPasswordResetToken(token: string, passwordHash: string): string {
  try {
    const c = jwt.verify(token, resetSecret(passwordHash)) as JwtPayload & { typ?: string };
    if (c.typ !== 'reset' || !c.sub) throw new Error('wrong type');
    return c.sub;
  } catch {
    throw new UnauthorizedError('Invalid or expired reset token');
  }
}
