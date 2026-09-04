'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { fieldControlClasses, fieldDescribedBy } from '@/components/ui/field';
import { loginRequestSchema, type LoginRequest } from '@/validation/login.schema';

import { useAuth } from './auth-context';

export function LoginForm() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [formError, setFormError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginRequest>({
    defaultValues: { email: '', password: '' },
    resolver: zodResolver(loginRequestSchema),
  });

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/invoices');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (formError !== undefined) {
      errorSummaryRef.current?.focus();
    }
  }, [formError]);

  const submit = handleSubmit(async (values) => {
    setFormError(undefined);
    const result = await login(values.email, values.password);

    if (result.ok) {
      router.replace('/invoices');
      return;
    }

    setFormError(result.message);
  });

  return (
    <form className="mt-8 space-y-5" noValidate onSubmit={submit}>
      <p className="text-sm text-neutral-600">
        Fields marked <span className="text-danger-600 font-semibold">*</span> are required.
      </p>
      {formError !== undefined ? (
        <div
          className="border-danger-200 bg-danger-50 text-danger-900 focus:ring-danger-600 rounded-lg border px-4 py-3 text-sm leading-6 outline-none focus:ring-2"
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
        >
          {formError}
        </div>
      ) : null}

      <div>
        <label
          className="after:text-danger-600 text-sm font-semibold text-neutral-800 after:ml-1 after:content-['*']"
          htmlFor="email"
        >
          Email
        </label>
        <input
          aria-describedby={fieldDescribedBy('email', { error: errors.email?.message })}
          aria-invalid={errors.email ? 'true' : 'false'}
          autoCapitalize="none"
          autoComplete="email"
          className={fieldControlClasses}
          id="email"
          required
          type="email"
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-danger-600 mt-2 text-sm" id="email-error">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <label
          className="after:text-danger-600 text-sm font-semibold text-neutral-800 after:ml-1 after:content-['*']"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          <input
            aria-describedby={fieldDescribedBy('password', { error: errors.password?.message })}
            aria-invalid={errors.password ? 'true' : 'false'}
            autoComplete="current-password"
            className={`${fieldControlClasses} pr-20`}
            id="password"
            required
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
          />
          <button
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-600 absolute top-1/2 right-2 min-h-10 -translate-y-1/2 rounded-md px-3 text-sm font-semibold outline-none focus-visible:ring-2"
            onClick={() => setShowPassword((visible) => !visible)}
            type="button"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password ? (
          <p className="text-danger-600 mt-2 text-sm" id="password-error">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button
        aria-describedby={isSubmitting ? 'login-submit-status' : undefined}
        className="w-full"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
      {isSubmitting ? (
        <span aria-live="polite" className="sr-only" id="login-submit-status" role="status">
          Signing in.
        </span>
      ) : null}
    </form>
  );
}
