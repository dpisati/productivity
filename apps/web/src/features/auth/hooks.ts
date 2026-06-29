import { useMutation } from '@tanstack/react-query';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '@productivity/shared';
import { useAuthStore } from '@/stores/auth';
import { queryClient } from '@/lib/query-client';
import { authApi } from './api';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (res) => setSession(res.user, res.tokens),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (res) => setSession(res.user, res.tokens),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => authApi.forgotPassword(input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => authApi.resetPassword(input),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return () => {
    clear();
    queryClient.clear();
  };
}
