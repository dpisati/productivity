import type {
  AccessTokenResponse,
  AuthResponse,
  ForgotPasswordInput,
  LoginInput,
  MessageResponse,
  PublicUser,
  RegisterInput,
  ResetPasswordInput,
} from '@productivity/shared';
import { api } from '@/lib/api-client';

export const authApi = {
  login: (input: LoginInput) => api.post<AuthResponse>('/auth/login', input, { auth: false }),
  register: (input: RegisterInput) =>
    api.post<AuthResponse>('/auth/register', input, { auth: false }),
  forgotPassword: (input: ForgotPasswordInput) =>
    api.post<MessageResponse>('/auth/forgot-password', input, { auth: false }),
  resetPassword: (input: ResetPasswordInput) =>
    api.post<MessageResponse>('/auth/reset-password', input, { auth: false }),
  refresh: () => api.post<AccessTokenResponse>('/auth/refresh', {}, { auth: false }),
  me: () => api.get<PublicUser>('/users/me'),
};
