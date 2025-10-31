import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types';
import { Button } from '@/components/ui/Button';

const formSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormValues = z.infer<typeof formSchema>;

type LocationState = {
  from?: Location;
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = (location.state as LocationState | undefined)?.from?.pathname ?? '/';
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const roleDestinations: Record<string, string> = useMemo(
    () => ({ 
      ADMIN: '/admin', 
      TEACHER: '/teacher',
      admin: '/admin', 
      teacher: '/teacher' 
    }),
    [],
  );

  const fillAdminCredentials = () => {
    setValue('email', 'admin@school.com');
    setValue('password', 'admin123');
  };

  const fillTeacherCredentials = () => {
    setValue('email', 'john.doe@school.com');
    setValue('password', 'teacher123');
  };

  const onSubmit = handleSubmit(async (values: FormValues) => {
    try {
      setError('');
      console.log('Attempting login with:', values.email);
      await login(values.email, values.password);
      console.log('Login successful, checking cached user...');
      
      const cached = localStorage.getItem('ams:user');
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { role: UserRole };
          console.log('Navigating to:', roleDestinations[parsed.role]);
          navigate(roleDestinations[parsed.role], { replace: true });
          return;
        } catch (error) {
          console.warn('Unable to parse cached user after login', error);
        }
      }
      console.log('Navigating to default redirect:', redirectTo);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-500">
          Sign in with the credentials provided by your school administrator.
        </p>
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-rose-500">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>

          <div className="space-y-2 border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 text-center mb-2">Quick login for testing:</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-sm"
                onClick={fillAdminCredentials}
              >
                Test Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1 text-sm"
                onClick={fillTeacherCredentials}
              >
                Test Teacher
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
