'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import AuthShell from '@/components/AuthShell';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { createClient } from '@/lib/supabase/client';
import { getErrorMessage } from '@/lib/errors';
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validators/auth';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      toast.error(getErrorMessage(error, t('auth.reset.error')));
      return;
    }

    toast.success(t('auth.reset.success'));
    router.push('/dashboard');
  };

  return (
    <AuthShell
      eyebrow={t('auth.reset.eyebrow')}
      title={t('auth.reset.title')}
      footer={<Link href="/login">{t('auth.reset.backToLogin')}</Link>}
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="input-group">
          <label htmlFor="password" className="input-label">
            {t('auth.fields.newPassword')}
          </label>
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

        <div className="input-group">
          <label htmlFor="confirm_password" className="input-label">
            {t('auth.fields.confirmPassword')}
          </label>
          <input
            id="confirm_password"
            type="password"
            className="input"
            placeholder="********"
            {...register('confirm_password')}
            required
          />
          <FieldError message={errors.confirm_password?.message} />
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={isSubmitting}>
          {isSubmitting ? '...' : t('auth.reset.submit')}
        </button>
      </form>
    </AuthShell>
  );
}
