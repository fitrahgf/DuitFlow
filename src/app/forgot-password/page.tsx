'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import {
  forgotPasswordSchema,
  type ForgotPasswordValues,
} from '@/lib/validators/auth';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(getErrorMessage(error, t('auth.forgot.error')));
      return;
    }

    toast.success(t('auth.forgot.success'));
  };

  return (
    <AuthShell
      eyebrow={t('auth.forgot.eyebrow')}
      title={t('auth.forgot.title')}
      footer={<Link href="/login">{t('auth.forgot.backToLogin')}</Link>}
    >
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

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          {isSubmitting ? '...' : t('auth.forgot.submit')}
        </button>
      </form>
    </AuthShell>
  );
}
