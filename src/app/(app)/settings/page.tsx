'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Moon, Palette, Save, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { FieldError } from '@/components/shared/FieldError';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme, type Theme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { cn } from '@/lib/utils';
import {
  formatCurrencyAmount,
  getCurrencyName,
  supportedCurrencyCodes,
} from '@/lib/currency';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchCurrentProfile, type ProfileQueryResult } from '@/lib/queries/profile';
import { createClient } from '@/lib/supabase/client';
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
  type ProfileSettingsValues,
} from '@/lib/validators/profile';
import type { Language } from '@/lib/i18n/dictionaries';

const timezones = ['Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura', 'UTC'];
const nativeSelectClassName =
  'flex min-h-[3rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

type SettingsTab = 'profile' | 'regional' | 'appearance' | 'notifications';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: fetchCurrentProfile,
    retry: false,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProfileSettingsInput, undefined, ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: '',
      timezone: 'Asia/Jakarta',
      currency_code: 'IDR',
      theme_preference: 'system',
      preferred_language: 'id',
      notification_preferences: {
        wishlist_due: true,
        budget_warning: true,
        budget_exceeded: true,
      },
    },
  });

  const selectedTheme = useWatch({ control, name: 'theme_preference' });
  const selectedLanguage = useWatch({ control, name: 'preferred_language' });
  const selectedCurrency = useWatch({ control, name: 'currency_code' });

  useEffect(() => {
    const profile = profileQuery.data?.profile;

    if (!profile) {
      return;
    }

    reset({
      full_name: profile.full_name ?? '',
      timezone: profile.timezone,
      currency_code: profile.currency_code,
      theme_preference: profile.theme_preference,
      preferred_language: profile.preferred_language,
      notification_preferences: profile.notification_preferences,
    });
  }, [profileQuery.data?.profile, reset]);

  const profileMutation = useMutation({
    mutationFn: async (values: ProfileSettingsValues) => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(t('settings.loadError'));
      }

      const { error } = await supabase.from('profiles').upsert(
        {
          id: user.id,
          full_name: values.full_name || null,
          display_name: values.full_name || null,
          timezone: values.timezone,
          currency_code: values.currency_code,
          theme_preference: values.theme_preference,
          preferred_language: values.preferred_language,
          notification_preferences: values.notification_preferences,
        },
        { onConflict: 'id' }
      );

      if (error) {
        throw error;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: values.full_name,
        },
      });

      if (authError) {
        throw authError;
      }

      return values;
    },
    onSuccess: async (values) => {
      queryClient.setQueryData<ProfileQueryResult | undefined>(queryKeys.profile.me, (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          profile: {
            ...current.profile,
            full_name: values.full_name || null,
            display_name: values.full_name || null,
            timezone: values.timezone,
            currency_code: values.currency_code,
            theme_preference: values.theme_preference,
            preferred_language: values.preferred_language,
            notification_preferences: values.notification_preferences,
          },
        };
      });

      if (theme !== values.theme_preference) {
        setTheme(values.theme_preference);
      }

      if (language !== values.preferred_language) {
        setLanguage(values.preferred_language);
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      toast.success(t('settings.saveSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('settings.saveError')));
    },
  });

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: t('settings.appearance.light'), icon: <Sun size={18} /> },
    { value: 'dark', label: t('settings.appearance.dark'), icon: <Moon size={18} /> },
    { value: 'system', label: t('settings.appearance.system'), icon: <Palette size={18} /> },
  ];

  const languageOptions: { value: Language; label: string; code: string }[] = [
    { value: 'id', label: t('settings.language.indonesian'), code: 'ID' },
    { value: 'en', label: t('settings.language.english'), code: 'EN' },
  ];

  const tabs: { value: SettingsTab; label: string }[] = [
    { value: 'profile', label: t('settings.profile.title') },
    { value: 'regional', label: t('settings.language.title') },
    { value: 'appearance', label: t('settings.appearance.title') },
    { value: 'notifications', label: t('settings.notifications.title') },
  ];
  const currencyOptions = supportedCurrencyCodes.map((currencyCode) => ({
    value: currencyCode,
    label: `${currencyCode} - ${getCurrencyName(selectedLanguage ?? language, currencyCode)}`,
  }));
  const currencyPreview = formatCurrencyAmount(
    1234567,
    selectedLanguage ?? language,
    selectedCurrency ?? 'IDR'
  );

  if (profileQuery.isLoading) {
    return (
      <PageShell className="animate-fade-in">
        <PageHeader>
          <PageHeading title={t('settings.title')} />
        </PageHeader>
        <Card>
          <EmptyState title={t('common.loading')} compact />
        </Card>
      </PageShell>
    );
  }

  if (profileQuery.isError) {
    return (
      <PageShell className="animate-fade-in">
        <PageHeader>
          <PageHeading title={t('settings.title')} />
        </PageHeader>
        <Card>
          <EmptyState title={t('settings.loadError')} compact />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('settings.title')} />
        <PageHeaderActions>
          <Button
            type="submit"
            form="settings-form"
            variant="primary"
            disabled={profileMutation.isPending}
          >
            <Save size={16} />
            {profileMutation.isPending ? t('settings.saving') : t('settings.save')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <form
        id="settings-form"
        className="grid gap-5"
        onSubmit={handleSubmit(async (values) => {
          await profileMutation.mutateAsync(values);
        })}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as SettingsTab)}
          className="grid gap-5"
        >
          <div className="overflow-x-auto pb-1">
            <TabsList className="w-max min-w-full justify-start rounded-2xl">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-xl px-4 py-2 text-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0">
            <SurfaceCard>
              <div className="grid gap-5">
                <SectionHeading title={t('settings.profile.title')} />

                <div className="grid gap-4 md:grid-cols-2">
                  <SettingsField
                    label={t('settings.profile.fullName')}
                    htmlFor="full_name"
                    error={errors.full_name?.message}
                  >
                    <Input
                      id="full_name"
                      type="text"
                      placeholder={t('settings.profile.fullNamePlaceholder')}
                      {...register('full_name')}
                    />
                  </SettingsField>

                  <SettingsField label={t('settings.profile.email')} htmlFor="account_email">
                    <Input
                      id="account_email"
                      type="email"
                      value={profileQuery.data?.email ?? ''}
                      disabled
                      readOnly
                    />
                  </SettingsField>
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>

          <TabsContent value="regional" className="mt-0">
            <div className="grid gap-5">
              <SurfaceCard>
                <div className="grid gap-5">
                  <SectionHeading title={t('settings.language.title')} />

                  <div className="grid gap-3 md:grid-cols-2">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          'inline-flex min-h-[3.15rem] items-center justify-between gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border px-4 text-sm font-semibold transition',
                          selectedLanguage === option.value
                            ? 'border-border-strong bg-surface-2 text-text-1'
                            : 'border-border-subtle bg-surface-1 text-text-2 hover:border-border-strong hover:bg-surface-2'
                        )}
                        onClick={() =>
                          setValue('preferred_language', option.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <span>{option.label}</span>
                        <span className="rounded-full bg-surface-2 px-2 py-1 text-[0.68rem] font-semibold text-text-3">
                          {option.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard>
                <div className="grid gap-5">
                  <SectionHeading
                    title={language === 'id' ? 'Zona waktu & mata uang' : 'Timezone & currency'}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <SettingsField
                      label={t('settings.regional.timezone')}
                      htmlFor="timezone"
                      error={errors.timezone?.message}
                    >
                      <select id="timezone" className={nativeSelectClassName} {...register('timezone')}>
                        {timezones.map((timezone) => (
                          <option key={timezone} value={timezone}>
                            {timezone}
                          </option>
                        ))}
                      </select>
                    </SettingsField>

                    <SettingsField
                      label={t('settings.regional.currency')}
                      htmlFor="currency_code"
                      error={errors.currency_code?.message}
                    >
                      <select id="currency_code" className={nativeSelectClassName} {...register('currency_code')}>
                        {currencyOptions.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                    </SettingsField>
                  </div>

                  <div className="rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-1 p-4">
                    <div className="grid gap-1">
                      <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                        {language === 'id' ? 'Preview format' : 'Format preview'}
                      </span>
                      <strong className="text-lg font-semibold tracking-[-0.03em] text-text-1">
                        {currencyPreview}
                      </strong>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <SurfaceCard>
              <div className="grid gap-5">
                <SectionHeading title={t('settings.appearance.title')} />

                <div className="grid gap-3 md:grid-cols-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        'inline-flex min-h-[6.5rem] flex-col items-start justify-between gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border px-4 py-4 text-left transition',
                        selectedTheme === option.value
                          ? 'border-border-strong bg-surface-2 text-text-1'
                          : 'border-border-subtle bg-surface-1 text-text-2 hover:border-border-strong hover:bg-surface-2'
                      )}
                      onClick={() =>
                        setValue('theme_preference', option.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-surface-1 text-text-1">
                        {option.icon}
                      </span>
                      <span className="text-sm font-semibold">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <SurfaceCard>
              <div className="grid gap-5">
                <SectionHeading title={t('settings.notifications.title')} />

                <div className="grid gap-3">
                  <ToggleField
                    title={t('settings.notifications.wishlistDue')}
                  >
                    <Controller
                      control={control}
                      name="notification_preferences.wishlist_due"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t('settings.notifications.wishlistDue')}
                        />
                      )}
                    />
                  </ToggleField>

                  <ToggleField
                    title={t('settings.notifications.budgetWarning')}
                  >
                    <Controller
                      control={control}
                      name="notification_preferences.budget_warning"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t('settings.notifications.budgetWarning')}
                        />
                      )}
                    />
                  </ToggleField>

                  <ToggleField
                    title={t('settings.notifications.budgetExceeded')}
                  >
                    <Controller
                      control={control}
                      name="notification_preferences.budget_exceeded"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t('settings.notifications.budgetExceeded')}
                        />
                      )}
                    />
                  </ToggleField>
                </div>
              </div>
            </SurfaceCard>
          </TabsContent>
        </Tabs>
      </form>
    </PageShell>
  );
}

function SettingsField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label
        className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function ToggleField({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-1 p-4">
      <div className="grid gap-1">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">{title}</strong>
      </div>
      <div className="pt-1">{children}</div>
    </div>
  );
}
