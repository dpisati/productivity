import type { AuthTokens } from '@productivity/shared';
import { authTokens, useAuthStore } from '@/stores/auth';
import { API_BASE_URL } from '@/lib/config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  /** Internal: prevents infinite refresh recursion. */
  _retry?: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

let refreshPromise: Promise<boolean> | null = null;

/** Exchange the refresh token for new tokens. Deduplicated across callers. */
async function refreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  const refreshToken = authTokens.refresh;
  if (!refreshToken) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(buildUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { tokens: AuthTokens };
      useAuthStore.getState().setTokens(data.tokens);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, auth = true, _retry = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (auth && authTokens.access) headers.authorization = `Bearer ${authTokens.access}`;

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Transparently refresh once on 401 for authenticated requests.
  if (res.status === 401 && auth && !_retry && authTokens.refresh) {
    if (await refreshSession()) {
      return apiRequest<T>(path, { ...options, _retry: true });
    }
    useAuthStore.getState().clear();
  }

  if (res.status === 204) return undefined as T;

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText, err?.details);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'GET', query }),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: RequestOptions) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
