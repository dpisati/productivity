import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { password } from '@productivity/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError } from '@/lib/api-client';
import { AuthLayout } from '../AuthLayout';
import { useResetPassword } from '../hooks';

const formSchema = z.object({ password });
type FormValues = z.infer<typeof formSchema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const reset = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await reset.mutateAsync({ token, password: values.password });
      toast.success('Password updated — please sign in');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Reset failed');
    }
  });

  return (
    <AuthLayout
      title="Choose a new password"
      footer={<Link className="text-primary hover:underline" to="/login">Back to sign in</Link>}
    >
      {token ? (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-destructive">Missing or invalid reset token.</p>
      )}
    </AuthLayout>
  );
}
