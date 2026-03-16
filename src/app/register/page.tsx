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
import { registerSchema, type RegisterValues } from '@/lib/validators/auth';

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (values: RegisterValues) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          full_name: values.full_name,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      toast.error(getErrorMessage(error, t('auth.register.error')));
      return;
    }

    if (data.session) {
      toast.success(t('auth.register.successSignedIn'));
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const nextParams = new URLSearchParams({
      notice: 'confirm-email',
      email: values.email,
    });

    toast.success(t('auth.register.success'));
    router.push(`/login?${nextParams.toString()}`);
  };

  return (
    <AuthShell
      eyebrow={t('auth.register.eyebrow')}
      title={t('auth.register.title')}
      footer={
        <>
          {t('auth.register.hasAccount')}{' '}
          <Link href="/login">{t('auth.register.signIn')}</Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="input-group">
          <label htmlFor="full_name" className="input-label">
            {t('auth.fields.fullName')}
          </label>
          <input
            id="full_name"
            type="text"
            className="input"
            placeholder={t('auth.register.fullNamePlaceholder')}
            {...register('full_name')}
            required
          />
          <FieldError message={errors.full_name?.message} />
        </div>

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
          <label htmlFor="password" className="input-label">
            {t('auth.fields.password')}
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
          {isSubmitting ? '...' : t('auth.register.submit')}
        </button>
      </form>
    </AuthShell>
  );
}
