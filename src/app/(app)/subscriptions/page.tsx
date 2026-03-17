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
}: {
  label: string;
  value: React.ReactNode;
  tone?: "default" | "accent" | "success" | "warning";
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
    <div className="grid gap-1 px-3 py-2.5 first:pl-0 last:pr-0">
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

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t("subscriptions.title")} />
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

      <SurfaceCard>
        <div className="grid gap-3">
          <div className="grid gap-3 border-b border-border-subtle/80 pb-3">
            <SectionHeading
              title={language === "id" ? "Daftar langganan" : "Subscription list"}
            />
            <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border-subtle/80">
              <SubscriptionOverviewStat
                label={t("subscriptions.totalMonthly")}
                value={loading ? "..." : formatCurrency(monthlyTotal)}
                tone="accent"
              />
              <SubscriptionOverviewStat
                label={t("subscriptions.activeServices")}
                value={loading ? "..." : activeSubscriptions.length}
                tone="success"
              />
              <SubscriptionOverviewStat
                label={t("subscriptions.upcoming")}
                value={loading ? "..." : upcomingCount}
                tone={upcomingCount > 0 ? "warning" : "default"}
              />
              <SubscriptionOverviewStat
                label={t("subscriptions.title")}
                value={loading ? "..." : subscriptions.length}
              />
            </div>
          </div>

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
                    className="grid gap-3 py-3 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="grid h-10 w-10 place-items-center rounded-2xl"
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
                            <Play size={22} fill="currentColor" />
                          ) : (
                            <Pause size={22} />
                          )}
                        </div>

                        <div className="grid gap-2">
                          <div className="flex flex-wrap items-center gap-2">
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
                            {upcoming ? (
                              <Badge variant="warning">
                                {t("subscriptions.upcoming")}
                              </Badge>
                            ) : null}
                          </div>
                          <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
                            {subscription.name}
                          </strong>
                          <div className="flex flex-wrap items-center gap-2 text-[0.82rem] text-text-2">
                            <span>
                              {t("subscriptions.billingOn")}{" "}
                              {subscription.billing_day}
                            </span>
                            <span aria-hidden="true">/</span>
                            <strong className="font-semibold tracking-[-0.02em] text-text-1">
                              {formatCurrency(subscription.amount)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:col-span-2 lg:justify-end">
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
                            {t("subscriptions.pause")}
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            {t("subscriptions.resume")}
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
