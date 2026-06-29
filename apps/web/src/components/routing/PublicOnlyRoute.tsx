import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';

/** Keep authenticated users out of auth pages. */
export function PublicOnlyRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/" replace />;
  return <Outlet />;
}
