"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Bot, Link2, Moon, Palette, Save, Sun, Unlink } from "lucide-react";
import { toast } from "sonner";
import { FieldError } from "@/components/shared/FieldError";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PageHeader,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
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
import {
  createTelegramConnectLink,
  disconnectTelegramConnection,
  fetchTelegramConnection,
} from "@/lib/queries/telegram";
import { createClient } from "@/lib/supabase/client";
import {
  profileSettingsSchema,
  type ProfileSettingsInput,
  type ProfileSettingsValues,
} from "@/lib/validators/profile";
import type { Language } from "@/lib/i18n/dictionaries";

const timezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura", "UTC"];

type SettingsTab = "profile" | "regional" | "appearance" | "notifications";
type ExtendedSettingsTab = SettingsTab | "integrations";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<ExtendedSettingsTab>("profile");
  const profileQuery = useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: fetchCurrentProfile,
    retry: false,
  });
  const telegramQuery = useQuery({
    queryKey: queryKeys.telegram.connection,
    queryFn: fetchTelegramConnection,
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
  const telegramConnectMutation = useMutation({
    mutationFn: createTelegramConnectLink,
    onSuccess: (result) => {
      window.open(result.url, "_blank", "noopener,noreferrer");
      toast.success(t("settings.telegram.connectStarted"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("settings.telegram.connectError")));
    },
  });
  const telegramDisconnectMutation = useMutation({
    mutationFn: async () =>
      disconnectTelegramConnection(profileQuery.data?.profile.id ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.telegram.connection,
      });
      toast.success(t("settings.telegram.disconnectSuccess"));
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, t("settings.telegram.disconnectError")),
      );
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

  const tabs: { value: ExtendedSettingsTab; label: string }[] = [
    { value: "profile", label: t("settings.profile.title") },
    { value: "regional", label: t("settings.language.title") },
    { value: "appearance", label: t("settings.appearance.title") },
    { value: "notifications", label: t("settings.notifications.title") },
    { value: "integrations", label: t("settings.telegram.title") },
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
  const activeTabLabel =
    tabs.find((tab) => tab.value === activeTab)?.label ?? t("settings.title");

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
      <PageHeader>
        <PageHeading
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
        />
      </PageHeader>

      <form
        id="settings-form"
        className="grid gap-3"
        onSubmit={handleSubmit(async (values) => {
          await profileMutation.mutateAsync(values);
        })}
      >
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as ExtendedSettingsTab)}
          className="grid gap-3"
        >
          <div className="pb-0.5">
            <TabsList className="!flex !w-auto gap-1 rounded-[calc(var(--radius-control)+0.06rem)] border border-border-subtle/75 bg-surface-2/52 p-0.5 sm:!grid sm:!w-full sm:grid-cols-3 xl:grid-cols-5">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="min-w-max shrink-0 rounded-[calc(var(--radius-control)-0.06rem)] px-3.5 py-1.5 text-[0.77rem] sm:min-w-0 sm:w-full md:flex-1"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="profile" className="mt-0 mx-auto w-full max-w-4xl">
            <SettingsTabPanel>
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
                    description={t("settings.profile.emailHint")}
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
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent value="regional" className="mt-0 mx-auto w-full max-w-5xl">
            <SettingsTabPanel>
              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] xl:gap-6">
                <SettingsSectionCard
                  title={t("settings.language.title")}
                  description={t("settings.language.subtitle")}
                  className="xl:border-r xl:border-border-subtle/80 xl:pr-6"
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
                      <Badge>{selectedCurrency ?? "IDR"}</Badge>
                    </div>
                  </div>
                </SettingsSectionCard>
              </div>
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent value="appearance" className="mt-0 mx-auto w-full max-w-4xl">
            <SettingsTabPanel>
              <SettingsSectionCard
                title={t("settings.appearance.title")}
                description={t("settings.appearance.subtitle")}
              >
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
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent
            value="notifications"
            className="mt-0 mx-auto w-full max-w-4xl"
          >
            <SettingsTabPanel>
              <SettingsSectionCard title={t("settings.notifications.title")}>
                <div className="grid gap-2">
                  <ToggleField
                    title={t("settings.notifications.wishlistDue")}
                    description={t("settings.notifications.wishlistDueHint")}
                  >
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

                  <ToggleField
                    title={t("settings.notifications.budgetWarning")}
                    description={t("settings.notifications.budgetWarningHint")}
                  >
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

                  <ToggleField
                    title={t("settings.notifications.budgetExceeded")}
                    description={t("settings.notifications.budgetExceededHint")}
                  >
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
            </SettingsTabPanel>
          </TabsContent>

          <TabsContent
            value="integrations"
            className="mt-0 mx-auto w-full max-w-4xl"
          >
            <SettingsTabPanel>
              <SettingsSectionCard title={t("settings.telegram.title")}>
                <div className="grid gap-3 border-t border-border-subtle/80 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] bg-surface-2/65 text-text-1">
                      <Bot size={18} />
                    </span>
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                          @
                          {telegramQuery.data?.botUsername ||
                            process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
                            "DuitFlowMoneyTrack_Bot"}
                        </strong>
                        <Badge
                          variant={
                            telegramQuery.data?.connected ? "accent" : "default"
                          }
                        >
                          {telegramQuery.data?.connected
                            ? t("settings.telegram.connected")
                            : t("settings.telegram.disconnected")}
                        </Badge>
                      </div>
                      {telegramQuery.data?.connected &&
                      telegramQuery.data.username ? (
                        <span className="text-[0.82rem] leading-5 text-text-2">
                          @{telegramQuery.data.username}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      disabled={
                        telegramConnectMutation.isPending ||
                        !telegramQuery.data?.botUsername
                      }
                      onClick={() => telegramConnectMutation.mutate()}
                    >
                      <Link2 size={16} />
                      {telegramQuery.data?.connected
                        ? t("settings.telegram.reconnect")
                        : t("settings.telegram.connect")}
                    </Button>
                    {telegramQuery.data?.connected ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={telegramDisconnectMutation.isPending}
                        onClick={() => telegramDisconnectMutation.mutate()}
                      >
                        <Unlink size={16} />
                        {t("settings.telegram.disconnect")}
                      </Button>
                    ) : null}
                  </div>
                </div>
              </SettingsSectionCard>
            </SettingsTabPanel>
          </TabsContent>
        </Tabs>

        <div className="sticky bottom-[calc(4.75rem+var(--safe-bottom))] z-10 mx-auto w-full max-w-4xl pt-1 md:bottom-0">
          <div className="rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1/95 px-3 py-2.5 shadow-xs backdrop-blur">
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    isDirty ? "bg-accent" : "bg-border-strong/60",
                  )}
                />
                <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                  {activeTabLabel}
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
        "grid gap-2 border-b border-border-subtle/80 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] sm:items-start",
        className,
      )}
    >
      <div className="grid gap-0.5">
        <label
          className="text-[0.76rem] font-medium tracking-[0.01em] text-text-2"
          htmlFor={htmlFor}
        >
          {label}
        </label>
        {description ? (
          <p className="m-0 text-[0.82rem] leading-[1.55] text-text-2">
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
    <div className={cn("grid gap-2.5 sm:gap-3", className)}>
      <SectionHeading
        title={title}
        description={description}
        hideDescriptionOnMobile={false}
      />
      {children}
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
  return (
    <SurfaceCard padding="compact" className={className}>
      <div className="grid gap-4 sm:gap-5">{children}</div>
    </SurfaceCard>
  );
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
    <div className="grid gap-2 border-b border-border-subtle/80 py-3 last:border-b-0 last:pb-0 first:pt-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
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
