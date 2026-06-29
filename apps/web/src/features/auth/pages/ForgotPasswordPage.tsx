import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { forgotPasswordInput, type ForgotPasswordInput } from '@productivity/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthLayout } from '../AuthLayout';
import { useForgotPassword } from '../hooks';

export function ForgotPasswordPage() {
  const forgot = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordInput) });

  const onSubmit = handleSubmit(async (values) => {
    const res = await forgot.mutateAsync(values);
    toast.success(res.message);
  });

  return (
    <AuthLayout
      title="Reset password"
      description="We’ll email you a reset link"
      footer={<Link className="text-primary hover:underline" to="/login">Back to sign in</Link>}
    >
      {isSubmitSuccessful ? (
        <p className="text-sm text-muted-foreground">
          If an account exists for that email, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
