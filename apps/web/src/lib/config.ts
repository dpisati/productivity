/** Base path for API requests. Proxied to the backend in dev (see vite.config). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';
