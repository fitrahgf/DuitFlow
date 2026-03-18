"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Link2, Moon, Palette, Save, Sun } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/FieldError";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Theme } from "@/components/ThemeProvider";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";
import {
  formatCurrencyAmount,
  getCurrencyName,
  supportedCurrencyCodes,
} from "@/lib/currency";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchCurrentProfile,
  type ProfileQueryResult,
} from "@/lib/queries/profile";
import { createClient } from "@/lib/supabase/client";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
  type ProfileSettingsValues,
} from "@/lib/validators/profile";
import type { Language } from "@/lib/i18n/dictionaries";

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];

type SettingsTab = "profile" | "regional" | "appearance" | "notifications";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
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
    formState: { errors, isDirty },
  } = useForm<ProfileSettingsInput, undefined, ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      full_name: "",
      timezone: "Asia/Jakarta",
      currency_code: "IDR",
      theme_preference: "system",
      preferred_language: "id",
      notification_preferences: {
        wishlist_due: true,
        budget_warning: true,
        budget_exceeded: true,
      },
    },
  });

  const selectedTheme = useWatch({ control, name: "theme_preference" });
  const selectedLanguage = useWatch({ control, name: "preferred_language" });
  const selectedCurrency = useWatch({ control, name: "currency_code" });
  const selectedTimezone = useWatch({ control, name: "timezone" });
  const selectedFullName = useWatch({ control, name: "full_name" });
  const notificationPreferences = useWatch({
    control,
    name: "notification_preferences",
  });

  useEffect(() => {
    const profile = profileQuery.data?.profile;

    if (!profile) {
      return;
    }

    reset({
      full_name: profile.full_name ?? "",
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
        throw new Error(t("settings.loadError"));
      }

      const { error } = await supabase.from("profiles").upsert(
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
        { onConflict: "id" },
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
      queryClient.setQueryData<ProfileQueryResult | undefined>(
        queryKeys.profile.me,
        (current) => {
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
        },
      );

      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      toast.success(t("settings.saveSuccess"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("settings.saveError")));
    },
  });

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] =
    [
      {
        value: "light",
        label: t("settings.appearance.light"),
        icon: <Sun size={18} />,
      },
      {
        value: "dark",
        label: t("settings.appearance.dark"),
        icon: <Moon size={18} />,
      },
      {
        value: "system",
        label: t("settings.appearance.system"),
        icon: <Palette size={18} />,
      },
    ];

  const languageOptions: { value: Language; label: string; code: string }[] = [
    { value: "id", label: t("settings.language.indonesian"), code: "ID" },
    { value: "en", label: t("settings.language.english"), code: "EN" },
  ];

  const tabs: {
    value: SettingsTab;
    label: string;
  }[] = [
    {
      value: "profile",
      label: t("settings.profile.title"),
    },
    {
      value: "regional",
      label: t("settings.language.title"),
    },
    {
      value: "appearance",
      label: t("settings.appearance.title"),
    },
    {
      value: "notifications",
      label: t("settings.notifications.title"),
    },
  ];
  const currencyOptions = supportedCurrencyCodes.map((currencyCode) => ({
    value: currencyCode,
    label: `${currencyCode} - ${getCurrencyName(selectedLanguage ?? language, currencyCode)}`,
  }));
  const currencyPreview = formatCurrencyAmount(
    1234567,
    selectedLanguage ?? language,
    selectedCurrency ?? "IDR",
  );
  const activeTabMeta = tabs.find((tab) => tab.value === activeTab) ?? tabs[0];
  const activeTabLabel = activeTabMeta.label;
  const currentThemeLabel =
    themeOptions.find((option) => option.value === selectedTheme)?.label ??
    t("settings.appearance.system");
  const currentLanguageLabel =
    languageOptions.find((option) => option.value === selectedLanguage)?.label ??
    t("settings.language.indonesian");
  const enabledNotificationCount = Object.values(
    notificationPreferences ?? {},
  ).filter(Boolean).length;
  const notSetLabel = language === "id" ? "Belum diatur" : "Not set";
  const unsavedChangesLabel =
    language === "id" ? "Perubahan belum disimpan" : "Unsaved changes";
  const savedStateLabel =
    language === "id" ? "Tidak ada perubahan baru" : "No pending changes";

  if (profileQuery.isLoading) {
    return (
      <PageShell className="mx-auto w-full max-w-[68rem] animate-fade-in">
        <PageHeader>
          <PageHeading
            title={t("settings.title")}
            subtitle={t("settings.subtitle")}
          />
        </PageHeader>
        <SurfaceCard padding="compact" className="max-w-3xl">
          <EmptyState title={t("common.loading")} compact />
        </SurfaceCard>
      </PageShell>
    );
  }

  if (profileQuery.isError) {
    return (
      <PageShell className="mx-auto w-full max-w-[68rem] animate-fade-in">
        <PageHeader>
          <PageHeading
            title={t("settings.title")}
            subtitle={t("settings.subtitle")}
          />
        </PageHeader>
        <SurfaceCard padding="compact" className="max-w-3xl">
          <EmptyState title={t("settings.loadError")} compact />
        </SurfaceCard>
      </PageShell>
    );
  }

  return (
    <PageShell className="mx-auto w-full max-w-[68rem] animate-fade-in">
      <PageHeader variant="compact">
        <PageHeading title={t("settings.title")} compact />
        <PageHeaderActions>
          <Button asChild variant="secondary" size="sm" className="w-full sm:w-auto">
            <Link href="/settings/integrations">
              <Link2 size={16} />
              {t("settings.telegram.title")}
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <form
        id="settings-form"
        className="grid gap-2.5"
        onSubmit={handleSubmit(async (values) => {
          await profileMutation.mutateAsync(values);
        })}
        >
        <SurfaceCard role="embedded" padding="compact" className="mx-auto w-full max-w-[66rem]">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as SettingsTab)}
            className="grid gap-3 xl:grid-cols-[15rem_minmax(0,1fr)] xl:gap-4"
          >
            <div className="grid gap-3 border-b border-border-subtle/80 pb-3 xl:border-b-0 xl:border-r xl:border-border-subtle/80 xl:pb-0 xl:pr-4">
              <TabsList className="!flex !w-auto gap-1 rounded-[calc(var(--radius-control)+0.04rem)] border border-border-subtle/75 bg-surface-2/44 p-0.5 sm:!grid sm:!w-full sm:grid-cols-3 xl:!grid xl:!w-full xl:grid-cols-1 xl:gap-1 xl:!border-0 xl:!bg-transparent xl:!p-0">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="min-w-max shrink-0 rounded-[calc(var(--radius-control)-0.06rem)] px-3.5 py-2 text-[0.8rem] sm:min-w-0 sm:w-full md:flex-1 xl:min-h-[auto] xl:w-full xl:justify-start xl:rounded-[calc(var(--radius-card)-0.18rem)] xl:px-3 xl:py-2.5 xl:text-left xl:data-[state=active]:bg-surface-2/88 xl:data-[state=active]:shadow-none"
                  >
                    <span className="text-[0.83rem] font-semibold tracking-[-0.01em] text-text-1">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="grid gap-4 xl:gap-5">
              <div className="grid gap-2 border-b border-border-subtle/80 pb-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
                <div className="grid gap-0.5">
                  <strong className="text-lg font-semibold tracking-[-0.04em] text-text-1">
                    {activeTabLabel}
                  </strong>
                </div>
                <span className={cn(
                  "text-[var(--font-size-meta)] font-medium",
                  isDirty ? "text-accent-strong" : "text-text-2",
                )}>
                  {isDirty ? unsavedChangesLabel : savedStateLabel}
                </span>
              </div>

          <TabsContent value="profile" className="mt-0">
            <SettingsTabPanel className="xl:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)] xl:items-start">
              <SettingsSectionCard title={t("settings.profile.title")}>
                <div className="grid gap-2">
                  <SettingsField
                    label={t("settings.profile.fullName")}
                    htmlFor="full_name"
                    error={errors.full_name?.message}
                  >
                    <Input
                      id="full_name"
                      type="text"
                      placeholder={t("settings.profile.fullNamePlaceholder")}
                      {...register("full_name")}
                    />
                  </SettingsField>

                  <SettingsField
                    label={t("settings.profile.email")}
                    htmlFor="account_email"
                  >
                    <Input
                      id="account_email"
                      type="email"
                      value={profileQuery.data?.email ?? ""}
                      className="cursor-not-allowed bg-surface-2/72 text-text-2 hover:border-border-subtle hover:bg-surface-2/72"
                      disabled
                      readOnly
                    />
                  </SettingsField>
                </div>
              </SettingsSectionCard>
              <SettingsContextPanel
                title={language === "id" ? "Ringkasan" : "Summary"}
              >
                <SettingsInfoRow
                  label={t("settings.profile.fullName")}
                  value={selectedFullName?.trim() || notSetLabel}
                />
                <SettingsInfoRow
                  label={t("settings.profile.email")}
                  value={profileQuery.data?.email ?? notSetLabel}
                />
                <SettingsInfoRow
                  label={t("settings.language.title")}
                  value={currentLanguageLabel}
                />
                <SettingsInfoRow
                  label={t("settings.regional.timezone")}
                  value={selectedTimezone ?? "Asia/Jakarta"}
                />
                <SettingsInfoRow
                  label={t("settings.regional.currency")}
                  value={selectedCurrency ?? "IDR"}
                />
              </SettingsContextPanel>
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent value="regional" className="mt-0">
            <SettingsTabPanel className="xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.82fr)] xl:items-start">
              <div className="grid gap-4">
                <SettingsSectionCard
                  title={t("settings.language.title")}
                >
                  <div className="grid gap-1 rounded-[calc(var(--radius-card)-0.16rem)] bg-surface-2/35 p-1 sm:grid-cols-2 xl:grid-cols-1">
                    {languageOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={cn(
                          "inline-flex min-h-[3.1rem] items-center justify-between gap-3 rounded-[calc(var(--radius-control)-0.04rem)] px-3 py-2 text-left transition",
                          selectedLanguage === option.value
                            ? "bg-accent-soft/78 text-text-1 ring-1 ring-accent/28"
                            : "bg-transparent text-text-2 hover:bg-surface-1/88",
                        )}
                        onClick={() =>
                          setValue("preferred_language", option.value, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      >
                        <span className="grid gap-0.5">
                          <span className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                            {option.label}
                          </span>
                          <span className="text-[0.72rem] font-medium tracking-[0.05em] text-text-2">
                            {option.code}
                          </span>
                        </span>
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            selectedLanguage === option.value
                              ? "bg-accent"
                              : "bg-border-subtle",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </SettingsSectionCard>

                <SettingsSectionCard
                  title={
                    language === "id"
                      ? "Zona waktu & mata uang"
                      : "Timezone & currency"
                  }
                  className="h-full"
                >
                  <div className="grid gap-2">
                    <SettingsField
                      label={t("settings.regional.timezone")}
                      htmlFor="timezone"
                      error={errors.timezone?.message}
                    >
                      <NativeSelect id="timezone" {...register("timezone")}>
                        {timezones.map((timezone) => (
                          <option key={timezone} value={timezone}>
                            {timezone}
                          </option>
                        ))}
                      </NativeSelect>
                    </SettingsField>

                    <SettingsField
                      label={t("settings.regional.currency")}
                      htmlFor="currency_code"
                      error={errors.currency_code?.message}
                    >
                      <NativeSelect id="currency_code" {...register("currency_code")}>
                        {currencyOptions.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </SettingsField>

                    <div className="flex items-center justify-between gap-3 border-t border-border-subtle/80 pt-3">
                      <div className="grid gap-0.5">
                        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                          {t("settings.regional.currency")}
                        </span>
                        <strong className="text-base font-semibold tracking-[-0.03em] text-text-1 tabular-nums">
                          {currencyPreview}
                        </strong>
                      </div>
                      <span className="rounded-full bg-surface-2/72 px-2.5 py-1 text-[var(--font-size-chip)] font-medium text-text-2">
                        {selectedCurrency ?? "IDR"}
                      </span>
                    </div>
                  </div>
                </SettingsSectionCard>
              </div>
              <SettingsContextPanel
                title={language === "id" ? "Ringkasan wilayah" : "Region summary"}
              >
                <SettingsInfoRow
                  label={t("settings.language.title")}
                  value={currentLanguageLabel}
                />
                <SettingsInfoRow
                  label={t("settings.regional.timezone")}
                  value={selectedTimezone ?? "Asia/Jakarta"}
                />
                <SettingsInfoRow
                  label={t("settings.regional.currency")}
                  value={selectedCurrency ?? "IDR"}
                />
                <SettingsInfoRow
                  label={language === "id" ? "Contoh" : "Preview"}
                  value={currencyPreview}
                />
              </SettingsContextPanel>
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0">
            <SettingsTabPanel className="xl:grid-cols-[minmax(0,1fr)_minmax(16rem,0.86fr)] xl:items-start">
              <SettingsSectionCard title={t("settings.appearance.title")}>
                <div className="grid gap-1 rounded-[calc(var(--radius-card)-0.14rem)] bg-surface-2/35 p-1 sm:grid-cols-3">
                  {themeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "inline-flex min-h-[4rem] items-center gap-3 rounded-[calc(var(--radius-control)-0.04rem)] px-3 py-2.5 text-left transition",
                        selectedTheme === option.value
                          ? "bg-accent-soft/78 text-text-1 ring-1 ring-accent/28"
                          : "bg-transparent text-text-2 hover:bg-surface-1/88",
                      )}
                      onClick={() =>
                        setValue("theme_preference", option.value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] transition-colors",
                          selectedTheme === option.value
                            ? "bg-accent text-white"
                            : "bg-surface-1 text-text-1",
                        )}
                      >
                        {option.icon}
                      </span>
                      <span className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                        {option.label}
                      </span>
                    </button>
                  ))}
                </div>
              </SettingsSectionCard>
              <SettingsContextPanel
                title={language === "id" ? "Aktif" : "Current"}
              >
                <SettingsInfoRow
                  label={t("settings.appearance.title")}
                  value={currentThemeLabel}
                />
                <SettingsInfoRow
                  label={t("settings.language.title")}
                  value={currentLanguageLabel}
                />
                <SettingsInfoRow
                  label={t("settings.regional.currency")}
                  value={currencyPreview}
                />
              </SettingsContextPanel>
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0">
            <SettingsTabPanel className="xl:grid-cols-[minmax(0,1.08fr)_minmax(16rem,0.92fr)] xl:items-start">
              <SettingsSectionCard title={t("settings.notifications.title")}>
                <div className="grid gap-2">
                  <ToggleField title={t("settings.notifications.wishlistDue")}>
                    <Controller
                      control={control}
                      name="notification_preferences.wishlist_due"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t("settings.notifications.wishlistDue")}
                        />
                      )}
                    />
                  </ToggleField>

                  <ToggleField title={t("settings.notifications.budgetWarning")}>
                    <Controller
                      control={control}
                      name="notification_preferences.budget_warning"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t("settings.notifications.budgetWarning")}
                        />
                      )}
                    />
                  </ToggleField>

                  <ToggleField title={t("settings.notifications.budgetExceeded")}>
                    <Controller
                      control={control}
                      name="notification_preferences.budget_exceeded"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label={t("settings.notifications.budgetExceeded")}
                        />
                      )}
                    />
                  </ToggleField>
                </div>
              </SettingsSectionCard>
              <SettingsContextPanel
                title={language === "id" ? "Status" : "Status"}
              >
                <SettingsInfoRow
                  label={language === "id" ? "Aktif" : "Enabled"}
                  value={`${enabledNotificationCount}/3`}
                />
                <SettingsInfoRow
                  label={t("settings.notifications.wishlistDue")}
                  value={
                    notificationPreferences?.wishlist_due
                      ? language === "id"
                        ? "Aktif"
                        : "On"
                      : language === "id"
                        ? "Nonaktif"
                        : "Off"
                  }
                />
                <SettingsInfoRow
                  label={t("settings.notifications.budgetWarning")}
                  value={
                    notificationPreferences?.budget_warning
                      ? language === "id"
                        ? "Aktif"
                        : "On"
                      : language === "id"
                        ? "Nonaktif"
                        : "Off"
                  }
                />
              </SettingsContextPanel>
            </SettingsTabPanel>
          </TabsContent>

            </div>
          </Tabs>
        </SurfaceCard>

        <div className="sticky bottom-[calc(4.75rem+var(--safe-bottom))] z-10 mx-auto w-full max-w-[66rem] pt-1 md:bottom-0">
          <div className="rounded-[calc(var(--radius-card)-0.12rem)] border border-border-subtle/75 bg-surface-1/84 px-3 py-2 shadow-none">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    isDirty ? "bg-accent" : "bg-border-strong/60",
                  )}
                />
                <span className="text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2">
                  {isDirty ? unsavedChangesLabel : savedStateLabel}
                </span>
              </div>
              <Button
                type="submit"
                form="settings-form"
                variant="primary"
                size="sm"
                fullWidth
                className="sm:w-auto"
                disabled={profileMutation.isPending || !isDirty}
              >
                <Save size={16} />
                {profileMutation.isPending
                  ? t("settings.saving")
                  : t("settings.save")}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </PageShell>
  );
}

function SettingsField({
  label,
  htmlFor,
  error,
  description,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5 py-2 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] sm:items-start",
        className,
      )}
    >
      <div className="grid gap-0.5">
        <label
          className="text-[var(--font-size-helper)] font-medium tracking-[-0.01em] text-text-2"
          htmlFor={htmlFor}
        >
          {label}
        </label>
        {description ? (
          <p className="m-0 text-[var(--font-size-meta)] leading-[1.45] text-text-2">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        {children}
        <FieldError message={error} />
      </div>
    </div>
  );
}

function SettingsSectionCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      <div className="grid gap-0.5">
        <strong className="text-[0.95rem] font-semibold tracking-[-0.03em] text-text-1">
          {title}
        </strong>
        {description ? (
          <p className="m-0 text-[var(--font-size-meta)] leading-[1.5] text-text-2">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function SettingsContextPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 rounded-[calc(var(--radius-card)-0.12rem)] border border-border-subtle/70 bg-surface-2/26 p-2.5 sm:p-3">
      <div className="grid gap-0.5">
        <strong className="text-[0.92rem] font-semibold tracking-[-0.03em] text-text-1">
          {title}
        </strong>
        {description ? (
          <p className="m-0 text-[var(--font-size-meta)] leading-[1.55] text-text-2">
            {description}
          </p>
        ) : null}
      </div>
      <div className="grid gap-0 divide-y divide-border-subtle/80">
        {children}
      </div>
    </div>
  );
}

function SettingsInfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="text-[var(--font-size-meta)] font-medium tracking-[-0.01em] text-text-2">
        {label}
      </span>
      <span className="text-right text-sm font-semibold tracking-[-0.02em] text-text-1">
        {value}
      </span>
    </div>
  );
}

function SettingsTabPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,0.82fr)] xl:gap-5", className)}>{children}</div>;
}

function ToggleField({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 py-2.5 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="grid gap-0.5">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
          {title}
        </strong>
        {description ? (
          <p className="m-0 text-[0.82rem] leading-[1.55] text-text-2">
            {description}
          </p>
        ) : null}
      </div>
      <div className="pt-0.5 sm:justify-self-end sm:pt-0">{children}</div>
    </div>
  );
}



