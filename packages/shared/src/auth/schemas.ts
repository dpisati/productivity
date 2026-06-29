import { z } from 'zod';
import { email, password, uuid } from '../common/primitives.js';
import { userRole } from '../common/enums.js';

// ── Requests ────────────────────────────────────────────────────────────────

export const registerInput = z.object({
  email,
  password,
  name: z.string().min(1).max(120).trim(),
});
export type RegisterInput = z.infer<typeof registerInput>;

export const loginInput = z.object({
  email,
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginInput>;

export const refreshInput = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshInput>;

export const forgotPasswordInput = z.object({ email });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInput>;

export const resetPasswordInput = z.object({
  token: z.string().min(1),
  password,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordInput>;

export const verifyEmailInput = z.object({
  token: z.string().min(1),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailInput>;

// ── Responses ───────────────────────────────────────────────────────────────

export const publicUser = z.object({
  id: uuid,
  email: z.string().email(),
  name: z.string(),
  role: userRole,
  emailVerified: z.boolean(),
  createdAt: z.string(),
});
export type PublicUser = z.infer<typeof publicUser>;

export const authTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().describe('Access token lifetime in seconds'),
});
export type AuthTokens = z.infer<typeof authTokens>;

export const authResponse = z.object({
  user: publicUser,
  tokens: authTokens,
});
export type AuthResponse = z.infer<typeof authResponse>;

export const accessTokenResponse = z.object({
  tokens: authTokens,
});
export type AccessTokenResponse = z.infer<typeof accessTokenResponse>;

/** Generic acknowledgement for endpoints that intentionally reveal nothing. */
export const messageResponse = z.object({ message: z.string() });
export type MessageResponse = z.infer<typeof messageResponse>;
