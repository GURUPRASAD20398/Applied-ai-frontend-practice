import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema } from '../utils/validators';
import { useAuth } from '../context/AuthContext';
import { parseError } from '../services/api';
import FormField from '../components/common/FormField';
import { ArrowRightIcon } from '../components/common/Icons';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const from = location.state?.from || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(loginSchema), defaultValues: { email: '', password: '', remember: false } });

  if (isAuthenticated) return <Navigate to={from} replace />;

  const onSubmit = async ({ email, password, remember }) => {
    setServerError('');
    try {
      await login(email, password, remember);
      navigate(from, { replace: true });
    } catch (e) {
      setServerError(parseError(e).message);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-light text-white">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Welcome back! Sign in to continue.</p>

        {serverError && (
          <div role="alert" className="mt-4 border-l-4 border-danger bg-layer-2 px-3 py-2 text-sm text-ink">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
          <FormField label="Email" id="email" error={errors.email?.message}>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email')}
            />
          </FormField>
          <FormField label="Password" id="password" error={errors.password?.message}>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" className="h-4 w-4 accent-primary" {...register('remember')} />
            Remember me
          </label>
          <button type="submit" className="btn-primary w-full justify-between py-3" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
            <ArrowRightIcon />
          </button>
        </form>

        <div className="mt-6 bg-layer-2 p-3 text-xs text-muted">
          <p className="font-semibold text-ink">Demo accounts</p>
          <p>Customer: user@bookstore.com / User@1234</p>
          <p>Admin: admin@bookstore.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
}
