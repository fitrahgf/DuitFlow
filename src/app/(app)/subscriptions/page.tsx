"use client";

import { useState } from "react";
import { CreditCard, MonitorPlay, Pause, Play, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import {
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useSubscriptionsQuery,
  useUpdateSubscriptionStatusMutation,
} from "@/features/subscriptions/hooks";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";
import { cn } from "@/lib/utils";

function getSubscriptionStateLabel(isActive: boolean, language: "en" | "id") {
  if (isActive) {
    return language === "id" ? "Aktif" : "Active";
  }

  return language === "id" ? "Dijeda" : "Paused";
}

function SubscriptionOverviewStat({
  label,
  value,
  tone = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
  className?: string;
}) {
  const dotClassName =
    tone === "accent"
      ? "bg-accent"
      : tone === "success"
        ? "bg-success"
        : tone === "warning"
          ? "bg-warning"
          : "bg-text-3/35";

  return (
    <div className={cn("grid gap-1 px-3 py-2.5 first:pl-0 last:pr-0", className)}>
      <div className="inline-flex items-center gap-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClassName)} aria-hidden="true" />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const subscriptionsQuery = useSubscriptionsQuery();
  const createSubscriptionMutation = useCreateSubscriptionMutation();
  const updateSubscriptionStatusMutation =
    useUpdateSubscriptionStatusMutation();
  const deleteSubscriptionMutation = useDeleteSubscriptionMutation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingDay, setBillingDay] = useState(1);
  const subscriptions = subscriptionsQuery.data ?? [];
  const loading = subscriptionsQuery.isLoading;
  const submitting = createSubscriptionMutation.isPending;

  const resetForm = () => {
    setIsFormOpen(false);
    setName("");
    setAmount("");
    setBillingDay(1);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !amount) {
      return;
    }

    try {
      await createSubscriptionMutation.mutateAsync({
        name,
        amount: parseInt(amount, 10),
        billingDay,
      });
      resetForm();
      toast.success(t("common.saved"));
    } catch (error) {
      console.error(error);
      toast.error(t("transactions.form.saveError"));
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateSubscriptionStatusMutation.mutateAsync({
        id,
        isActive: currentStatus,
      });
      toast.success(
        currentStatus ? t("subscriptions.pause") : t("subscriptions.resume"),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      description: t("subscriptions.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    try {
      await deleteSubscriptionMutation.mutateAsync(id);
      toast.success(t("common.deleted"));
    } catch (error) {
      console.error(error);
    }
  };

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.is_active,
  );
  const pausedCount = subscriptions.filter(
    (subscription) => !subscription.is_active,
  ).length;
  const monthlyTotal = activeSubscriptions.reduce(
    (sum, subscription) => sum + subscription.amount,
    0,
  );
  const today = new Date().getDate();
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0,
  ).getDate();

  const isUpcoming = (billDay: number) => {
    let diff = billDay - today;

    if (diff < 0) {
      diff = daysInMonth - today + billDay;
    }

    return diff >= 0 && diff <= 3;
  };

  const upcomingCount = subscriptions.filter(
    (subscription) =>
      subscription.is_active && isUpcoming(subscription.billing_day),
  ).length;
  const getDaysUntilBilling = (billDay: number) => {
    let diff = billDay - today;

    if (diff < 0) {
      diff = daysInMonth - today + billDay;
    }

    return diff;
  };
  const nextBillingSubscription = [...activeSubscriptions].sort(
    (left, right) =>
      getDaysUntilBilling(left.billing_day) - getDaysUntilBilling(right.billing_day),
  )[0];
  const showOverviewRail = loading || subscriptions.length > 0;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading
          title={t("subscriptions.title")}
          subtitle={t("subscriptions.subtitle")}
        />
        <PageHeaderActions>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() => setIsFormOpen(true)}
          >
            <CreditCard size={16} />
            {t("subscriptions.addSubscription")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      {showOverviewRail ? (
        <section className="grid gap-3 xl:grid-cols-[minmax(16rem,0.76fr)_minmax(0,1.24fr)] xl:items-start">
          <SurfaceCard padding="compact" className="xl:sticky xl:top-[var(--shell-sticky-offset)]">
            <div className="grid gap-3">
              <div className="grid gap-0 rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/45 sm:grid-cols-2 xl:grid-cols-1">
                <SubscriptionOverviewStat
                  label={t("subscriptions.totalMonthly")}
                  value={loading ? "..." : formatCurrency(monthlyTotal)}
                  tone="accent"
                />
                <SubscriptionOverviewStat
                  label={t("subscriptions.activeServices")}
                  value={loading ? "..." : activeSubscriptions.length}
                  tone="success"
                  className="border-t border-border-subtle/75 sm:border-l sm:border-t-0 xl:border-l-0 xl:border-t"
                />
                <SubscriptionOverviewStat
                  label={language === "id" ? "Dijeda" : "Paused"}
                  value={loading ? "..." : pausedCount}
                  className="border-t border-border-subtle/75 xl:border-t"
                />
                <SubscriptionOverviewStat
                  label={t("subscriptions.upcoming")}
                  value={loading ? "..." : upcomingCount}
                  tone={upcomingCount > 0 ? "warning" : "default"}
                  className="border-t border-border-subtle/75 sm:border-l sm:border-t xl:border-l-0"
                />
              </div>

              <div className="grid gap-1 border-t border-border-subtle/75 pt-2.5">
                <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                  {language === "id" ? "Tagihan terdekat" : "Next billing"}
                </span>
                <strong className="text-[0.96rem] font-semibold tracking-[-0.03em] text-text-1">
                  {loading
                    ? "..."
                    : nextBillingSubscription?.name ??
                      (language === "id"
                        ? "Belum ada layanan aktif."
                        : "No active service yet.")}
                </strong>
                <span className="text-[0.78rem] leading-5 text-text-2">
                  {loading
                    ? "..."
                    : nextBillingSubscription
                      ? `${t("subscriptions.billingOn")} ${nextBillingSubscription.billing_day} · ${getDaysUntilBilling(nextBillingSubscription.billing_day)} ${language === "id" ? "hari lagi" : "days left"}`
                      : language === "id"
                        ? "Tambahkan layanan pertama untuk mulai memantau tagihan rutin."
                        : "Add your first service to start tracking recurring bills."}
                </span>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="compact">
            <div className="grid gap-3">
              <SectionHeading
                title={language === "id" ? "Daftar langganan" : "Subscription list"}
              />

              {loading ? (
                <div className="grid gap-0 divide-y divide-border-subtle/80">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`subscription-skeleton-${index}`}
                      className="grid gap-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="skeleton h-10 w-10 rounded-2xl" />
                        <div className="grid min-w-0 flex-1 gap-2">
                          <div className="skeleton skeleton-line skeleton-line--sm" />
                          <div className="skeleton skeleton-line skeleton-line--lg" />
                        </div>
                      </div>
                      <div className="skeleton skeleton-line skeleton-line--md w-40" />
                    </div>
                  ))}
                </div>
              ) : subscriptions.length === 0 ? (
                <EmptyState
                  title={t("subscriptions.noSubscriptions")}
                  icon={<MonitorPlay size={20} />}
                  action={
                    <Button
                      type="button"
                      variant="primary"
                      onClick={() => setIsFormOpen(true)}
                    >
                      <CreditCard size={16} />
                      {t("subscriptions.addSubscription")}
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-0 divide-y divide-border-subtle/80">
                  {subscriptions.map((subscription) => {
                    const upcoming =
                      subscription.is_active &&
                      isUpcoming(subscription.billing_day);

                    return (
                      <article
                        key={subscription.id}
                        className="grid gap-2.5 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                      >
                        <div className="grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-3">
                          <div
                            className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.1rem)]"
                            style={{
                              backgroundColor: subscription.is_active
                                ? "var(--accent-soft)"
                                : "var(--surface-1)",
                              color: subscription.is_active
                                ? "var(--accent-strong)"
                                : "var(--text-3)",
                            }}
                          >
                            {subscription.is_active ? (
                              <Play size={18} fill="currentColor" />
                            ) : (
                              <Pause size={18} />
                            )}
                          </div>

                          <div className="grid min-w-0 gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <strong className="truncate text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1">
                                {subscription.name}
                              </strong>
                              <Badge
                                variant={
                                  subscription.is_active ? "accent" : "default"
                                }
                              >
                                {getSubscriptionStateLabel(
                                  subscription.is_active,
                                  language,
                                )}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[0.77rem] text-text-2">
                              <span>
                                {t("subscriptions.billingOn")}{" "}
                                {subscription.billing_day}
                              </span>
                              <span aria-hidden="true">/</span>
                              <span className={cn(upcoming && "text-warning")}>
                                {getDaysUntilBilling(subscription.billing_day)}{" "}
                                {language === "id" ? "hari lagi" : "days left"}
                              </span>
                              {upcoming ? (
                                <>
                                  <span aria-hidden="true">/</span>
                                  <span>{t("subscriptions.upcoming")}</span>
                                </>
                              ) : null}
                            </div>
                          </div>

                          <div className="grid justify-items-start gap-0.5 sm:justify-items-end">
                            <span className="text-[0.7rem] font-medium tracking-[0.01em] text-text-2">
                              {language === "id" ? "Bulanan" : "Monthly"}
                            </span>
                            <strong className="text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
                              {formatCurrency(subscription.amount)}
                            </strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          <Button
                            type="button"
                            variant={
                              subscription.is_active ? "secondary" : "primary"
                            }
                            size="sm"
                            onClick={() =>
                              toggleStatus(
                                subscription.id,
                                subscription.is_active,
                              )
                            }
                          >
                            {subscription.is_active ? (
                              <>
                                <Pause size={14} />
                                <span className="max-sm:hidden">
                                  {t("subscriptions.pause")}
                                </span>
                              </>
                            ) : (
                              <>
                                <Play size={14} />
                                <span className="max-sm:hidden">
                                  {t("subscriptions.resume")}
                                </span>
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-2xl text-danger"
                            onClick={() => {
                              void handleDelete(subscription.id);
                            }}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </SurfaceCard>
        </section>
      ) : (
        <SurfaceCard padding="compact">
          <div className="grid gap-3">
            <SectionHeading
              title={language === "id" ? "Daftar langganan" : "Subscription list"}
            />
            <EmptyState
              title={t("subscriptions.noSubscriptions")}
              icon={<MonitorPlay size={20} />}
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsFormOpen(true)}
                >
                  <CreditCard size={16} />
                  {t("subscriptions.addSubscription")}
                </Button>
              }
            />
          </div>
        </SurfaceCard>
      )}

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => (open ? setIsFormOpen(true) : resetForm())}
      >
        <DialogContent className="max-w-[30rem]">
          <DialogHeader>
            <DialogTitle>{t("subscriptions.form.new")}</DialogTitle>
          </DialogHeader>

          <form className="grid gap-4 pt-2" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label
                className="text-[0.78rem] font-medium tracking-[0.01em] text-text-2"
                htmlFor="subscription-name"
              >
                {t("subscriptions.form.name")}
              </label>
              <Input
                id="subscription-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="min-h-[2.85rem] px-3.5 py-2.5"
                placeholder="Netflix, Spotify, Gym"
                required
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <label
                  className="text-[0.78rem] font-medium tracking-[0.01em] text-text-2"
                  htmlFor="subscription-price"
                >
                  {t("subscriptions.form.price")}
                </label>
                <CurrencyInput
                  id="subscription-price"
                  value={amount}
                  onValueChange={setAmount}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                  placeholder="150000"
                  required
                />
              </div>

              <div className="grid gap-2">
                <label
                  className="text-[0.78rem] font-medium tracking-[0.01em] text-text-2"
                  htmlFor="subscription-billing-day"
                >
                  {t("subscriptions.form.billingDay")}
                </label>
                <Input
                  id="subscription-billing-day"
                  type="number"
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(event) =>
                    setBillingDay(parseInt(event.target.value || "1", 10))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t("subscriptions.form.cancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting
                  ? t("subscriptions.form.saving")
                  : t("subscriptions.form.add")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
