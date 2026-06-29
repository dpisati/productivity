import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, PublicUser } from '@productivity/shared';

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: PublicUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: PublicUser) => void;
  clear: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, accessToken: null, refreshToken: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'productivity-auth' },
  ),
);

/** Non-reactive accessors for use inside the API client (outside React). */
export const authTokens = {
  get access() {
    return useAuthStore.getState().accessToken;
  },
  get refresh() {
    return useAuthStore.getState().refreshToken;
  },
};
