import type { ReactNode } from "react";
import {
  CheckCircle,
  Clock3,
  ExternalLink,
  Pencil,
  ShoppingBasket,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import TransactionForm, {
  type TransactionFormPrefill,
} from "@/components/TransactionForm";
import { ModalShell } from "@/components/shared/ModalShell";
import {
  EmptyState,
} from "@/components/shared/EmptyState";
import { FieldError } from "@/components/shared/FieldError";
import {
  ProgressMeter,
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
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { WalletOption } from "@/lib/queries/reference";
import type { WishlistItem } from "@/lib/queries/wishlist";
import { cn } from "@/lib/utils";
import type {
  WishlistFormInput,
  WishlistFormValues,
  WishlistReviewInput,
  WishlistReviewValues,
} from "@/lib/validators/wishlist";

type ChoiceTone = "default" | "accent" | "warning" | "danger" | "success";

const choiceToneClassName: Record<ChoiceTone, string> = {
  default: "border-border-subtle bg-surface-1 text-text-2",
  accent: "border-accent bg-accent-soft text-accent-strong",
  warning: "border-warning/30 bg-warning-soft text-warning",
  danger: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
};

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
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

function SegmentedChoices({
  label,
  suffix,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  value?: string;
  onChange: (nextValue: "3" | "5" | "7") => void;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
        {label}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {(["3", "5", "7"] as const).map((dayValue) => (
          <button
            key={dayValue}
            type="button"
            className={cn(
              "inline-flex min-h-[2.7rem] items-center justify-center rounded-[calc(var(--radius-card)-0.18rem)] border px-3 text-sm font-semibold transition",
              value === dayValue
                ? "border-accent bg-accent-soft text-accent-strong"
                : "border-border-subtle bg-surface-1 text-text-2 hover:border-border-strong hover:bg-surface-2",
            )}
            onClick={() => onChange(dayValue)}
          >
            {dayValue} {suffix}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChoicePills({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    tone: ChoiceTone;
    icon?: ReactNode;
  }>;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
        {label}
      </span>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "inline-flex min-h-[2.7rem] items-center justify-center gap-2 rounded-[calc(var(--radius-card)-0.18rem)] border px-3 text-sm font-semibold transition",
              value === option.value
                ? choiceToneClassName[option.tone]
                : "border-border-subtle bg-surface-2/55 text-text-2 hover:border-border-strong hover:bg-surface-2",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MetaStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle bg-surface-2/55 p-3">
      <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-text-3">
        {label}
      </span>
      <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

function WishlistSummaryStat({
  label,
  value,
  meta,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  tone?: "default" | "accent" | "warning" | "success";
}) {
  const dotToneClassName =
    tone === "accent"
      ? "bg-accent"
      : tone === "warning"
        ? "bg-warning"
        : tone === "success"
          ? "bg-success"
          : "bg-text-3/35";

  return (
    <div className="grid gap-0.5 px-3 py-2.5 first:pl-0 last:pr-0">
      <div className="inline-flex items-center gap-2">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotToneClassName)}
          aria-hidden="true"
        />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
        {value}
      </strong>
      {meta ? (
        <span className="text-[0.76rem] leading-5 text-text-2">{meta}</span>
      ) : null}
    </div>
  );
}

interface WishlistSummarySectionProps {
  isLoading: boolean;
  itemsCount: number;
  dueCount: number;
  approvedCount: number;
  linkedWalletCount: number;
  totalTrackedValue: number;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
}

export function WishlistSummarySection({
  isLoading,
  itemsCount,
  dueCount,
  approvedCount,
  linkedWalletCount,
  totalTrackedValue,
  t,
  formatCurrency,
}: WishlistSummarySectionProps) {
  return (
    <SurfaceCard padding="compact">
      <div className="grid gap-0 sm:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-border-subtle/80">
        <WishlistSummaryStat
          label={t("wishlist.tabs.all")}
          value={isLoading ? "..." : itemsCount}
        />
        <WishlistSummaryStat
          label={t("wishlist.tabs.due")}
          value={isLoading ? "..." : dueCount}
          tone={dueCount > 0 ? "warning" : "default"}
        />
        <WishlistSummaryStat
          label={t("wishlist.tabs.approved")}
          value={isLoading ? "..." : approvedCount}
          tone={approvedCount > 0 ? "accent" : "default"}
        />
        <WishlistSummaryStat
          label={t("wishlist.meta.wallet")}
          value={isLoading ? "..." : linkedWalletCount}
          meta={isLoading ? undefined : formatCurrency(totalTrackedValue)}
          tone="success"
        />
      </div>
    </SurfaceCard>
  );
}

export function WishlistDueBanner({
  dueCount,
  t,
}: {
  dueCount: number;
  t: (key: string) => string;
}) {
  if (dueCount === 0) {
    return null;
  }

  return (
    <SurfaceCard
      padding="compact"
      className="border-accent/18 bg-surface-1"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)-0.02rem)] bg-accent-soft text-accent-strong">
            <Sparkles size={18} />
          </span>
          <div className="grid gap-1">
            <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
              {t("wishlist.sections.due")}
            </strong>
          </div>
        </div>
        <Badge variant="accent">{dueCount}</Badge>
      </div>
    </SurfaceCard>
  );
}

interface WishlistBoardSectionProps {
  items: WishlistItem[];
  activeTab: string;
  tabs: Array<{ key: string; label: string; count: number }>;
  activeSections: Array<{ title: string; items: WishlistItem[] }>;
  hasAnyVisibleItem: boolean;
  isLoading: boolean;
  isError: boolean;
  convertPending: boolean;
  language: "en" | "id";
  t: (key: string) => string;
  onTabChange: (value: string) => void;
  onCreateItem: () => void;
  onEditItem: (item: WishlistItem) => void;
  onReviewItem: (item: WishlistItem) => void;
  onConvertItem: (item: WishlistItem) => void;
  formatDate: (value: string, language: "en" | "id") => string;
  getCountdownLabel: (item: WishlistItem, language: "en" | "id") => string;
  getPriorityVariant: (
    priority: WishlistItem["priority"],
  ) => "danger" | "accent" | "warning";
  getStatusVariant: (
    status: WishlistItem["status"],
  ) => "success" | "danger" | "accent" | "warning";
  getCardTone: (item: WishlistItem) => string;
  getProgressTone: (
    item: WishlistItem,
  ) => "accent" | "success" | "warning" | "danger";
  isReviewDue: (item: WishlistItem) => boolean;
  getCoolingProgress: (item: WishlistItem) => number;
}

export function WishlistBoardSection({
  items,
  activeTab,
  tabs,
  activeSections,
  hasAnyVisibleItem,
  isLoading,
  isError,
  convertPending,
  language,
  t,
  onTabChange,
  onCreateItem,
  onEditItem,
  onReviewItem,
  onConvertItem,
  formatDate,
  getCountdownLabel,
  getPriorityVariant,
  getStatusVariant,
  getCardTone,
  getProgressTone,
  isReviewDue,
  getCoolingProgress,
}: WishlistBoardSectionProps) {
  const tabsLabel = language === "id" ? "Filter wishlist" : "Wishlist tabs";

  return (
    <SurfaceCard padding="compact">
      <div className="grid gap-3">
        <div>
          <div
            role="tablist"
            aria-label={tabsLabel}
            className="flex w-full items-center gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                id={`wishlist-tab-${tab.key}`}
                role="tab"
                type="button"
                aria-selected={activeTab === tab.key}
                aria-controls={`wishlist-panel-${tab.key}`}
                tabIndex={activeTab === tab.key ? 0 : -1}
                className={cn(
                  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.78rem] font-medium text-text-2 transition-[background-color,color,border-color] sm:min-w-[unset]",
                  activeTab === tab.key
                    ? "bg-surface-2 text-text-1"
                    : "hover:bg-surface-2/75 hover:text-text-1",
                )}
                data-state={activeTab === tab.key ? "active" : "inactive"}
                onClick={() => onTabChange(tab.key)}
              >
                <span>{tab.label}</span>
                <span className="inline-flex h-[1.05rem] min-w-[1.2rem] items-center justify-center rounded-full bg-surface-1/90 px-1.5 text-[0.64rem] font-semibold text-text-3">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div
          id={`wishlist-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`wishlist-tab-${activeTab}`}
          className="mt-0 outline-none"
        >
          {isLoading ? (
            <EmptyState title={t("common.loading")} compact />
          ) : isError ? (
            <EmptyState title={t("wishlist.loadError")} compact />
          ) : items.length === 0 ? (
            <WishlistEmptyBoard language={language} t={t} onCreateItem={onCreateItem} />
          ) : !hasAnyVisibleItem ? (
            <WishlistEmptyTabState
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              language={language}
              t={t}
            />
          ) : (
            <div className="grid gap-3">
              {activeSections.map((section) =>
                section.items.length > 0 ? (
                  <section key={section.title} className="grid gap-2.5">
                    <details
                      className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 sm:hidden"
                      open
                    >
                      <summary className="flex list-none items-center justify-between gap-3 px-3 py-2.5">
                        <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                          {section.title}
                        </strong>
                        <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
                          v
                        </span>
                      </summary>
                      <div className="border-t border-border-subtle px-3 py-2.5">
                        <div className="grid gap-2.5">
                          {section.items.map((item) => (
                            <WishlistItemCard
                              key={item.id}
                              item={item}
                              language={language}
                              t={t}
                              onEdit={() => onEditItem(item)}
                              onReview={() => onReviewItem(item)}
                              onConvert={() => onConvertItem(item)}
                              convertPending={convertPending}
                              formatDate={formatDate}
                              getCountdownLabel={getCountdownLabel}
                              getPriorityVariant={getPriorityVariant}
                              getStatusVariant={getStatusVariant}
                              getCardTone={getCardTone}
                              getProgressTone={getProgressTone}
                              isReviewDue={isReviewDue}
                              getCoolingProgress={getCoolingProgress}
                            />
                          ))}
                        </div>
                      </div>
                    </details>
                    <div className="hidden gap-3 sm:grid">
                      <SectionHeading title={section.title} />
                      <div className="grid gap-3 2xl:grid-cols-2">
                        {section.items.map((item) => (
                          <WishlistItemCard
                            key={item.id}
                            item={item}
                            language={language}
                            t={t}
                            onEdit={() => onEditItem(item)}
                            onReview={() => onReviewItem(item)}
                            onConvert={() => onConvertItem(item)}
                            convertPending={convertPending}
                            formatDate={formatDate}
                            getCountdownLabel={getCountdownLabel}
                            getPriorityVariant={getPriorityVariant}
                            getStatusVariant={getStatusVariant}
                            getCardTone={getCardTone}
                            getProgressTone={getProgressTone}
                            isReviewDue={isReviewDue}
                            getCoolingProgress={getCoolingProgress}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                ) : null,
              )}
            </div>
          )}
        </div>
      </div>
    </SurfaceCard>
  );
}

function WishlistEmptyBoard({
  language,
  t,
  onCreateItem,
}: {
  language: "en" | "id";
  t: (key: string) => string;
  onCreateItem: () => void;
}) {
  const steps = [
    {
      title: t("wishlist.addItem"),
      description: language === "id" ? "Simpan dulu" : "Save it first",
    },
    {
      title: t("wishlist.actions.reviewNow"),
      description: language === "id" ? "Tinjau saat jatuh tempo" : "Review when due",
    },
    {
      title: t("wishlist.actions.convert"),
      description:
        language === "id" ? "Ubah jadi transaksi" : "Convert to a transaction",
    },
  ];

  return (
    <div className="grid gap-3 rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/45 px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] bg-surface-1 text-text-2">
            <ShoppingBasket size={18} />
          </span>
          <div className="grid gap-1">
            <strong className="text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1">
              {t("wishlist.emptyTitle")}
            </strong>
            <span className="text-[0.82rem] leading-5 text-text-2">
              {language === "id"
                ? "Simpan barang yang ingin ditimbang, lalu review saat waktunya tiba."
                : "Save items to think through, then review them when they are due."}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={onCreateItem}
          className="sm:min-w-[9.5rem]"
        >
          <ShoppingBasket size={16} />
          {t("wishlist.addItem")}
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border-subtle/70 pt-2.5 text-[0.76rem] text-text-2">
        <span className="font-medium text-text-2">
          {language === "id" ? "Alur singkat" : "Quick flow"}
        </span>
        {steps.map((step, index) => (
          <div key={step.title} className="inline-flex items-center gap-2">
            <span>{step.description}</span>
            {index < steps.length - 1 ? (
              <span className="text-text-3/80">/</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function WishlistEmptyTabState({
  tabs,
  activeTab,
  onTabChange,
  language,
  t,
}: {
  tabs: Array<{ key: string; label: string; count: number }>;
  activeTab: string;
  onTabChange: (value: string) => void;
  language: "en" | "id";
  t: (key: string) => string;
}) {
  const availableTabs = tabs.filter(
    (tab) => tab.key !== activeTab && tab.count > 0,
  );

  return (
    <div className="grid gap-3 rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/45 px-3 py-3 sm:px-4 sm:py-4">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.04rem)] bg-surface-1 text-text-2">
          <Clock3 size={16} />
        </span>
        <div className="grid gap-1">
          <strong className="text-[0.96rem] font-semibold tracking-[-0.04em] text-text-1">
            {t("wishlist.emptyTabTitle")}
          </strong>
          <span className="text-[0.8rem] leading-5 text-text-2">
            {language === "id"
              ? "Tab ini belum punya item."
              : "This tab does not have any items yet."}
          </span>
        </div>
      </div>

      {availableTabs.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border-subtle/70 pt-2.5">
          {availableTabs.slice(0, 3).map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-surface-1 px-2.5 py-1.5 text-left transition hover:bg-surface-1/80 hover:text-text-1"
              onClick={() => onTabChange(tab.key)}
            >
              <span className="text-[0.8rem] font-medium tracking-[-0.01em] text-text-1">
                {tab.label}
              </span>
              <span className="inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-surface-1/90 px-1.5 py-0.5 text-[0.66rem] font-semibold text-text-3">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="border-t border-border-subtle/70 pt-2.5 text-[0.78rem] text-text-2">
          {language === "id"
            ? "Belum ada tab lain yang berisi item."
            : "There are no other tabs with items yet."}
        </div>
      )}
    </div>
  );
}

interface WishlistFormDialogProps {
  open: boolean;
  editingItem: WishlistItem | null;
  wallets: WalletOption[];
  walletsLoading: boolean;
  savePending: boolean;
  form: UseFormReturn<
    WishlistFormInput,
    undefined,
    WishlistFormValues
  >;
  t: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WishlistFormValues) => void;
}

export function WishlistFormDialog({
  open,
  editingItem,
  wallets,
  walletsLoading,
  savePending,
  form,
  t,
  onOpenChange,
  onSubmit,
}: WishlistFormDialogProps) {
  const selectedPriority = useWatch({
    control: form.control,
    name: "priority",
    defaultValue: "medium",
  });
  const selectedCoolingDays = useWatch({
    control: form.control,
    name: "cooling_days",
    defaultValue: "3",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? t("wishlist.form.edit") : t("wishlist.form.new")}
          </DialogTitle>
        </DialogHeader>

        <form
          className="grid gap-4 pt-2"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <input type="hidden" {...form.register("priority")} />
          <input type="hidden" {...form.register("cooling_days")} />

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label={t("wishlist.form.name")}
              htmlFor="wishlist-item-name"
              error={form.formState.errors.item_name?.message}
            >
              <Input
                id="wishlist-item-name"
                className="min-h-[2.85rem] px-3.5 py-2.5"
                {...form.register("item_name")}
              />
            </FormField>

            <FormField
              label={t("wishlist.form.price")}
              htmlFor="wishlist-target-price"
              error={form.formState.errors.target_price?.message}
            >
              <Controller
                control={form.control}
                name="target_price"
                render={({ field }) => (
                  <CurrencyInput
                    id="wishlist-target-price"
                    name={field.name}
                    placeholder="1500000"
                    value={field.value}
                    onBlur={field.onBlur}
                    onNumberValueChange={field.onChange}
                    ref={field.ref}
                    className="min-h-[2.85rem] px-3.5 py-2.5"
                  />
                )}
              />
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label={t("wishlist.form.url")}
              htmlFor="wishlist-url"
              error={form.formState.errors.url?.message}
            >
              <Input
                id="wishlist-url"
                type="url"
                className="min-h-[2.85rem] px-3.5 py-2.5"
                placeholder="https://..."
                {...form.register("url")}
              />
            </FormField>

            <FormField
              label={t("wishlist.form.wallet")}
              htmlFor="wishlist-wallet"
              error={form.formState.errors.selected_wallet_id?.message}
            >
              <NativeSelect
                id="wishlist-wallet"
                {...form.register("selected_wallet_id")}
              >
                <option value="">
                  {walletsLoading
                    ? t("common.loading")
                    : t("wishlist.form.walletOptional")}
                </option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <ChoicePills
              label={t("wishlist.form.priority")}
              value={selectedPriority}
              onChange={(value) =>
                form.setValue("priority", value as WishlistFormValues["priority"], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              options={[
                { value: "low", label: t("wishlist.priority.low"), tone: "accent" },
                {
                  value: "medium",
                  label: t("wishlist.priority.medium"),
                  tone: "warning",
                },
                { value: "high", label: t("wishlist.priority.high"), tone: "danger" },
              ]}
            />

            <SegmentedChoices
              label={t("wishlist.form.coolingPeriod")}
              suffix={t("wishlist.form.days")}
              value={selectedCoolingDays}
              onChange={(value) =>
                form.setValue("cooling_days", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label={t("wishlist.form.reason")}
              htmlFor="wishlist-reason"
              error={form.formState.errors.reason?.message}
            >
              <Textarea
                id="wishlist-reason"
                rows={4}
                className="min-h-[5.25rem] resize-y px-3.5 py-2.5"
                placeholder={t("wishlist.form.reasonPlaceholder")}
                {...form.register("reason")}
              />
            </FormField>

            <FormField
              label={t("wishlist.form.note")}
              htmlFor="wishlist-note"
              error={form.formState.errors.note?.message}
            >
              <Textarea
                id="wishlist-note"
                rows={4}
                className="min-h-[5.25rem] resize-y px-3.5 py-2.5"
                placeholder={t("wishlist.form.notePlaceholder")}
                {...form.register("note")}
              />
            </FormField>
          </div>

          <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={savePending}>
              {savePending ? t("common.loading") : t("common.save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface WishlistReviewDialogProps {
  reviewingItem: WishlistItem | null;
  open: boolean;
  savePending: boolean;
  form: UseFormReturn<
    WishlistReviewInput,
    undefined,
    WishlistReviewValues
  >;
  t: (key: string) => string;
  language: "en" | "id";
  formatCurrency: (amount: number) => string;
  formatDate: (value: string, language: "en" | "id") => string;
  getStatusVariant: (
    status: WishlistItem["status"],
  ) => "success" | "danger" | "accent" | "warning";
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: WishlistReviewValues) => void;
}

export function WishlistReviewDialog({
  reviewingItem,
  open,
  savePending,
  form,
  t,
  language,
  formatCurrency,
  formatDate,
  getStatusVariant,
  onOpenChange,
  onSubmit,
}: WishlistReviewDialogProps) {
  const nextReviewStatus = useWatch({
    control: form.control,
    name: "next_status",
    defaultValue: "approved_to_buy",
  });
  const selectedPostponeDays = useWatch({
    control: form.control,
    name: "postpone_days",
    defaultValue: "3",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[36rem]">
        <DialogHeader>
          <DialogTitle>{t("wishlist.review.title")}</DialogTitle>
        </DialogHeader>

        {reviewingItem ? (
          <div className="grid gap-4 pt-2">
            <Card className="border-border-subtle bg-surface-2/55 p-3 shadow-none">
              <div className="grid gap-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">
                      {reviewingItem.item_name}
                    </strong>
                    <span className="text-sm text-text-3">
                      {reviewingItem.target_price
                        ? formatCurrency(reviewingItem.target_price)
                        : "-"}
                    </span>
                  </div>
                  <Badge variant={getStatusVariant(reviewingItem.status)}>
                    {t(`wishlist.status.${reviewingItem.status}`)}
                  </Badge>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-3">
                  <MetaStat
                    label={t("wishlist.meta.reviewDate")}
                    value={formatDate(reviewingItem.review_date, language)}
                  />
                  <MetaStat
                    label={t("wishlist.meta.coolingDays")}
                    value={`${reviewingItem.cooling_days} ${t("wishlist.form.days").toLowerCase()}`}
                  />
                  <MetaStat
                    label={t("wishlist.meta.wallet")}
                    value={
                      reviewingItem.wallets?.name ??
                      t("wishlist.form.walletOptional")
                    }
                  />
                </div>
              </div>
            </Card>

            <form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
              <input type="hidden" {...form.register("next_status")} />
              <input type="hidden" {...form.register("postpone_days")} />

              <ChoicePills
                label={t("wishlist.review.action")}
                value={nextReviewStatus}
                onChange={(value) =>
                  form.setValue(
                    "next_status",
                    value as WishlistReviewValues["next_status"],
                    {
                      shouldDirty: true,
                      shouldValidate: true,
                    },
                  )
                }
                options={[
                  {
                    value: "approved_to_buy",
                    label: t("wishlist.actions.approve"),
                    tone: "accent",
                    icon: <CheckCircle size={16} />,
                  },
                  {
                    value: "postponed",
                    label: t("wishlist.actions.postpone"),
                    tone: "warning",
                    icon: <Clock3 size={16} />,
                  },
                  {
                    value: "cancelled",
                    label: t("wishlist.actions.cancel"),
                    tone: "danger",
                    icon: <XCircle size={16} />,
                  },
                ]}
              />

              {nextReviewStatus === "postponed" ? (
                <SegmentedChoices
                  label={t("wishlist.review.postponeDays")}
                  suffix={t("wishlist.form.days")}
                  value={selectedPostponeDays}
                  onChange={(value) =>
                    form.setValue("postpone_days", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              ) : null}

              <FieldError message={form.formState.errors.postpone_days?.message} />

              <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
                <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" variant="primary" disabled={savePending}>
                  {savePending ? t("common.loading") : t("wishlist.review.save")}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function WishlistConvertDialog({
  open,
  prefill,
  t,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  prefill: TransactionFormPrefill | null;
  t: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t("transactions.form.new")}
      size="lg"
      padding="flush"
      hideClose
      headerHidden
    >
      <TransactionForm
        initialValues={prefill}
        createSource="wishlist_conversion"
        onSuccess={onSuccess}
        onCancel={() => onOpenChange(false)}
      />
    </ModalShell>
  );
}

function WishlistItemCard({
  item,
  language,
  t,
  onEdit,
  onReview,
  onConvert,
  convertPending,
  formatDate,
  getCountdownLabel,
  getPriorityVariant,
  getStatusVariant,
  getCardTone,
  getProgressTone,
  isReviewDue,
  getCoolingProgress,
}: {
  item: WishlistItem;
  language: "en" | "id";
  t: (key: string) => string;
  onEdit: () => void;
  onReview: () => void;
  onConvert: () => void;
  convertPending: boolean;
  formatDate: (value: string, language: "en" | "id") => string;
  getCountdownLabel: (item: WishlistItem, language: "en" | "id") => string;
  getPriorityVariant: (
    priority: WishlistItem["priority"],
  ) => "danger" | "accent" | "warning";
  getStatusVariant: (
    status: WishlistItem["status"],
  ) => "success" | "danger" | "accent" | "warning";
  getCardTone: (item: WishlistItem) => string;
  getProgressTone: (
    item: WishlistItem,
  ) => "accent" | "success" | "warning" | "danger";
  isReviewDue: (item: WishlistItem) => boolean;
  getCoolingProgress: (item: WishlistItem) => number;
}) {
  const { formatCurrency } = useCurrencyPreferences();
  const isDue = isReviewDue(item);
  const progressValue =
    item.status === "approved_to_buy" ||
    item.status === "purchased" ||
    item.status === "cancelled"
      ? 1
      : getCoolingProgress(item);
  const statusSummary =
    item.status === "purchased"
      ? {
          icon: <CheckCircle size={16} className="text-success" />,
          label: t("wishlist.status.purchased"),
        }
      : item.status === "cancelled"
        ? {
            icon: <XCircle size={16} className="text-danger" />,
            label: t("wishlist.status.cancelled"),
          }
        : item.status === "approved_to_buy"
          ? {
              icon: <Sparkles size={16} className="text-accent-strong" />,
              label: getCountdownLabel(item, language),
            }
          : {
              icon: (
                <Clock3
                  size={16}
                  className={cn(isDue ? "text-warning" : "text-text-3")}
                />
              ),
              label: getCountdownLabel(item, language),
            };

  return (
    <Card
      className={cn(
        "grid gap-3.5 p-3.5 md:p-5",
        getCardTone(item),
        item.status === "purchased" && "opacity-90",
      )}
    >
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="grid gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={getStatusVariant(item.status)}>
              {t(`wishlist.status.${item.status}`)}
            </Badge>
            {item.priority === "high" ? (
              <Badge variant={getPriorityVariant(item.priority)}>
                {t(`wishlist.priority.${item.priority}`)}
              </Badge>
            ) : null}
            {isDue ? (
              <Badge variant="warning">{t("wishlist.actions.reviewNow")}</Badge>
            ) : null}
          </div>

          <div className="grid gap-0.5">
            <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
              {item.item_name}
            </strong>
            <span className="text-sm text-text-3">
              {item.target_price ? formatCurrency(item.target_price) : "-"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          {item.url ? (
            <Button asChild variant="ghost" size="sm">
              <a href={item.url} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {t("wishlist.link")}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-2xl"
            onClick={onEdit}
            aria-label={t("wishlist.form.edit")}
            title={t("wishlist.form.edit")}
          >
            <Pencil size={16} />
          </Button>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
            {t("wishlist.coolingLabel")}
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-text-2">
            {statusSummary.icon}
            <span>{statusSummary.label}</span>
          </span>
        </div>
        <ProgressMeter
          value={progressValue}
          tone={getProgressTone(item)}
          className="h-2.5 bg-surface-2"
          ariaLabel={item.item_name}
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <MetaStat
          label={t("wishlist.meta.reviewDate")}
          value={formatDate(item.review_date, language)}
        />
        <MetaStat
          label={t("wishlist.meta.coolingDays")}
          value={`${item.cooling_days} ${t("wishlist.form.days").toLowerCase()}`}
        />
        <MetaStat
          label={t("wishlist.meta.wallet")}
          value={item.wallets?.name ?? t("wishlist.form.walletOptional")}
        />
      </div>

      {item.reason || item.note ? (
        <>
          <div className="hidden gap-4 md:grid md:grid-cols-2">
            {item.reason ? (
              <div className="grid gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                  {t("wishlist.form.reason")}
                </span>
                <p className="m-0 text-sm leading-6 text-text-2">
                  {item.reason}
                </p>
              </div>
            ) : null}
            {item.note ? (
              <div className="grid gap-1">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                  {t("wishlist.form.note")}
                </span>
                <p className="m-0 text-sm leading-6 text-text-2">{item.note}</p>
              </div>
            ) : null}
          </div>
          <details className="group rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle bg-surface-1/70 md:hidden">
            <summary className="flex list-none items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-sm font-medium text-text-2">
                {language === "id" ? "Detail" : "Details"}
              </span>
              <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
                v
              </span>
            </summary>
            <div className="grid gap-3 border-t border-border-subtle px-3 py-3">
              {item.reason ? (
                <div className="grid gap-1">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                    {t("wishlist.form.reason")}
                  </span>
                  <p className="m-0 text-sm leading-5 text-text-2">
                    {item.reason}
                  </p>
                </div>
              ) : null}
              {item.note ? (
                <div className="grid gap-1">
                  <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
                    {t("wishlist.form.note")}
                  </span>
                  <p className="m-0 text-sm leading-5 text-text-2">
                    {item.note}
                  </p>
                </div>
              ) : null}
            </div>
          </details>
        </>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isDue ? (
          <Button type="button" variant="secondary" size="sm" onClick={onReview}>
            <Sparkles size={14} />
            {t("wishlist.actions.reviewNow")}
          </Button>
        ) : null}
        {item.status === "approved_to_buy" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onConvert}
            disabled={convertPending}
          >
            <ShoppingBasket size={14} />
            {t("wishlist.actions.convert")}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
