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
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/components/LanguageProvider";

function getSubscriptionStateLabel(isActive: boolean, language: "en" | "id") {
  if (isActive) {
    return language === "id" ? "Aktif" : "Active";
  }

  return language === "id" ? "Dijeda" : "Paused";
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

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("subscriptions.totalMonthly")}
          value={loading ? "..." : formatCurrency(monthlyTotal)}
          tone="accent"
        />
        <MetricCard
          label={t("subscriptions.activeServices")}
          value={loading ? "..." : activeSubscriptions.length}
          tone="success"
        />
        <MetricCard
          label={t("subscriptions.upcoming")}
          value={loading ? "..." : upcomingCount}
          tone={upcomingCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          label={t("subscriptions.title")}
          value={loading ? "..." : subscriptions.length}
        />
      </section>

      <SurfaceCard>
        <div className="grid gap-3">
          <SectionHeading
            title={language === "id" ? "Daftar langganan" : "Subscription list"}
          />

          {loading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card
                  key={`subscription-skeleton-${index}`}
                  className="grid gap-4 p-4 shadow-none"
                >
                  <div className="skeleton skeleton-line skeleton-line--sm" />
                  <div className="skeleton skeleton-line skeleton-line--lg" />
                  <div className="skeleton skeleton-line skeleton-line--md" />
                </Card>
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
            <div className="grid gap-3 xl:grid-cols-2">
              {subscriptions.map((subscription) => {
                const upcoming =
                  subscription.is_active &&
                  isUpcoming(subscription.billing_day);

                return (
                  <article
                    key={subscription.id}
                    className="grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-3.5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
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
                          <span className="text-sm text-text-3">
                            {t("subscriptions.billingOn")}{" "}
                            {subscription.billing_day}
                          </span>
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
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-text-3">
                      <span>
                        {t("subscriptions.form.billingDay")}{" "}
                        {subscription.billing_day}
                      </span>
                      <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">
                        {formatCurrency(subscription.amount)}
                      </strong>
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
                className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
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
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
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
                  className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3"
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
