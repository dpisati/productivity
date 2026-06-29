import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { PublicOnlyRoute } from '@/components/routing/PublicOnlyRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';

export const router: ReturnType<typeof createBrowserRouter> = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/income', element: <PlaceholderPage title="Income" /> },
          { path: '/expenses', element: <PlaceholderPage title="Expenses" /> },
          { path: '/categories', element: <PlaceholderPage title="Categories" /> },
          { path: '/tasks', element: <PlaceholderPage title="Tasks" /> },
          { path: '/calendar', element: <PlaceholderPage title="Calendar" /> },
          { path: '/notifications', element: <PlaceholderPage title="Notifications" /> },
          { path: '/integrations', element: <PlaceholderPage title="Integrations" /> },
          { path: '/settings', element: <PlaceholderPage title="Settings" /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
