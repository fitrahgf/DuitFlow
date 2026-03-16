'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { getAuthErrorKind, getErrorMessage } from '@/lib/errors';
import { loginSchema, type LoginValues } from '@/lib/validators/auth';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const authError = searchParams.get('error') === 'auth';
  const confirmationNotice = searchParams.get('notice') === 'confirm-email';
  const confirmationEmail = searchParams.get('email') ?? '';
  const [resendEmail, setResendEmail] = useState<string | null>(() =>
    confirmationNotice && confirmationEmail ? confirmationEmail : null
  );
  const [isResendPending, setIsResendPending] = useState(false);
  const confirmationBannerEmail = resendEmail ?? (confirmationNotice ? confirmationEmail : '');
  const initialEmail = useMemo(
    () => (confirmationNotice && confirmationEmail ? confirmationEmail : ''),
    [confirmationEmail, confirmationNotice]
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: '',
    },
  });

  const onSubmit = async (values: LoginValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);

    if (error) {
      if (getAuthErrorKind(error) === 'email_not_confirmed') {
        setResendEmail(values.email);
        toast.error(t('auth.login.emailNotConfirmed'));
        return;
      }

      toast.error(getErrorMessage(error, t('auth.login.error')));
      return;
    }

    setResendEmail(null);
    toast.success(t('auth.login.success'));
    router.push('/dashboard');
    router.refresh();
  };

  const handleResendConfirmation = async () => {
    if (!confirmationBannerEmail) {
      return;
    }

    const supabase = createClient();
    setIsResendPending(true);

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: confirmationBannerEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setIsResendPending(false);

    if (error) {
      toast.error(getErrorMessage(error, t('auth.login.resendError')));
      return;
    }

    toast.success(t('auth.login.resendSuccess'));
  };

  return (
    <AuthShell
      eyebrow={t('auth.login.eyebrow')}
      title={t('auth.login.title')}
      footer={
        <>
          {t('auth.login.noAccount')}{' '}
          <Link href="/register">{t('auth.login.createAccount')}</Link>
        </>
      }
    >
      {authError ? (
        <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {t('auth.login.callbackError')}
        </div>
      ) : null}

      {confirmationBannerEmail ? (
        <div
          className="grid gap-3 rounded-2xl border border-warning/20 bg-warning-soft/70 px-4 py-3 text-sm text-warning"
          role="status"
        >
          <span>
            {confirmationNotice
              ? t('auth.register.checkEmail')
              : t('auth.login.emailNotConfirmed')}
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs text-warning">
            <span className="break-all">{confirmationBannerEmail}</span>
            <button
              type="button"
              className="font-semibold text-warning transition hover:text-text-1 disabled:cursor-not-allowed disabled:opacity-70"
              onClick={() => void handleResendConfirmation()}
              disabled={isResendPending}
            >
              {isResendPending ? '...' : t('auth.login.resendConfirmation')}
            </button>
          </div>
        </div>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="input-group">
          <label htmlFor="email" className="input-label">
            {t('auth.fields.email')}
          </label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            {...register('email')}
            required
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="input-group">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="input-label">
              {t('auth.fields.password')}
            </label>
            <Link href="/forgot-password" className="text-sm font-semibold text-accent-strong transition hover:text-text-1">
              {t('auth.login.forgotPassword')}
            </Link>
          </div>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="********"
            {...register('password')}
            required
          />
          <FieldError message={errors.password?.message} />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          {isSubmitting ? '...' : t('auth.login.submit')}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell eyebrow="Welcome back" title="Sign in to continue">
          <div className="sr-only">Loading sign-in form</div>
        </AuthShell>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
