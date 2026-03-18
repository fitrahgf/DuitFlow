import type { Dispatch, SetStateAction } from "react";
import { Filter, ReceiptText, RotateCcw, Search } from "lucide-react";
import {
  FilterField,
  FilterFieldGrid,
  FilterGroup,
  FilterSearchField,
  FilterSelect,
  FilterToolbar,
  ToolbarActions,
} from "@/components/filters/FilterPatterns";
import TransactionForm from "@/components/TransactionForm";
import { ModalShell } from "@/components/shared/ModalShell";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  MetricCard,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  CategoryOption,
  WalletOption,
} from "@/lib/queries/reference";
import {
  defaultTransactionFilters,
  type TransactionFilters,
  type TransactionListItem,
  type TransactionPeriodFilter,
  type TransactionSortOption,
} from "@/lib/queries/transactions";
import type { TransactionDisplayItem } from "@/lib/transactionFeed";
import { cn } from "@/lib/utils";

type TransactionSearchSummary = {
  currentTotal: number;
  last30DaysTotal: number;
  averageAmount: number;
  count: number;
  latestTransaction: TransactionDisplayItem | null;
};

interface TransactionsFiltersSectionProps {
  filters: TransactionFilters;
  hasActiveFilters: boolean;
  activeFilterChips: string[];
  visibleFilterChips: string[];
  hiddenChipCount: number;
  language: "en" | "id";
  t: (key: string) => string;
  onReplaceFilters: (nextFilters: TransactionFilters) => void;
  onOpenAdvancedFilters: () => void;
  onResetAll: () => void;
  getPeriodLabel: (
    period: Exclude<TransactionPeriodFilter, "custom">,
    t: (key: string) => string,
  ) => string;
}

export function TransactionsFiltersSection({
  filters,
  hasActiveFilters,
  activeFilterChips,
  visibleFilterChips,
  hiddenChipCount,
  language,
  t,
  onReplaceFilters,
  onOpenAdvancedFilters,
  onResetAll,
  getPeriodLabel,
}: TransactionsFiltersSectionProps) {
  const mobileFilterSummary =
    hasActiveFilters && activeFilterChips.length > 0
      ? language === "id"
        ? `${activeFilterChips.length} filter aktif`
        : `${activeFilterChips.length} active filters`
      : language === "id"
        ? "Semua transaksi"
        : "All transactions";
  const compactFilterSummary =
    visibleFilterChips.length > 0
      ? `${visibleFilterChips.slice(0, 2).join(" / ")}${
          hiddenChipCount > 0 ? ` +${hiddenChipCount}` : ""
        }`
      : mobileFilterSummary;

  return (
    <SurfaceCard
      padding="none"
      className="sticky top-[var(--shell-sticky-offset)] z-20 border-transparent bg-transparent shadow-none sm:static sm:border-border-subtle sm:bg-surface-1 sm:shadow-xs"
    >
      <FilterToolbar className="gap-2 px-0 py-0 sm:px-[var(--space-panel-tight)] sm:py-[var(--space-panel-tight)] lg:px-[var(--space-panel)] lg:py-[var(--space-panel)]">
        <div className="grid gap-1.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <FilterSearchField
            id="transaction-search"
            value={filters.search}
            onChange={(event) =>
              onReplaceFilters({
                ...filters,
                search: event.target.value,
              })
            }
            onClear={() =>
              onReplaceFilters({
                ...filters,
                search: "",
              })
            }
            clearLabel={t("transactions.clearSearch")}
            placeholder={t("transactions.searchPlaceholder")}
            className="border-border-subtle/80 bg-surface-1 shadow-none"
            inputClassName="text-[0.82rem]"
          />

          <ToolbarActions className="hidden sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="max-sm:min-w-max"
              onClick={onOpenAdvancedFilters}
            >
              <Filter size={16} />
              {t("transactions.advancedFilters")}
            </Button>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="max-sm:min-w-max"
                onClick={onResetAll}
              >
                <RotateCcw size={16} />
                {t("transactions.resetAll")}
              </Button>
            ) : null}
          </ToolbarActions>
        </div>

        <details className="group rounded-[calc(var(--radius-card)-0.18rem)] border border-border-subtle/75 bg-surface-1 sm:hidden">
          <summary className="flex list-none items-center justify-between gap-3 px-2.75 py-2">
            <div className="grid gap-0.5">
              <strong className="text-[0.76rem] font-semibold tracking-[-0.03em] text-text-1">
                {language === "id" ? "Filter cepat" : "Quick filters"}
              </strong>
              <span className="text-[0.72rem] text-text-3">{mobileFilterSummary}</span>
            </div>
            <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
              v
            </span>
          </summary>

          <div className="grid gap-2 border-t border-border-subtle px-2.75 py-2">
            <div className="flex flex-wrap gap-1.25">
              {(["all", "expense", "income", "transfer"] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={filters.type === type ? "primary" : "ghost"}
                  className={cn(
                    "px-2.25",
                    filters.type !== type &&
                      "border-transparent text-text-2 hover:bg-surface-2/90 hover:text-text-1",
                  )}
                  onClick={() =>
                    onReplaceFilters({
                      ...filters,
                      type,
                    })
                  }
                >
                  {t(`transactions.${type}`)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.25">
              {(["all", "30d", "7d", "month"] as const).map((period) => (
                <Button
                  key={period}
                  type="button"
                  size="sm"
                  variant={filters.period === period ? "primary" : "ghost"}
                  className={cn(
                    "px-2.25",
                    filters.period !== period &&
                      "border-transparent text-text-2 hover:bg-surface-2/90 hover:text-text-1",
                  )}
                  onClick={() =>
                    onReplaceFilters({
                      ...filters,
                      period,
                      customFrom: "",
                      customTo: "",
                    })
                  }
                >
                  {getPeriodLabel(period, t)}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-border-subtle/80 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-2.25 text-[0.72rem]"
                onClick={onOpenAdvancedFilters}
              >
                <Filter size={15} />
                {t("transactions.advancedFilters")}
              </Button>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2.25 text-[0.72rem]"
                  onClick={onResetAll}
                >
                  <RotateCcw size={15} />
                  {t("transactions.resetAll")}
                </Button>
              ) : null}
              {hasActiveFilters ? (
                <span className="min-w-0 text-[0.72rem] text-text-3">
                  {compactFilterSummary}
                </span>
              ) : null}
            </div>
          </div>
        </details>

        <div className="hidden gap-2.5 lg:grid-cols-2 lg:gap-3 sm:grid">
          <FilterGroup label={t("transactions.quickType")}>
            {(["all", "expense", "income", "transfer"] as const).map((type) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={filters.type === type ? "primary" : "ghost"}
                className={cn(
                  "px-2.5",
                  filters.type !== type &&
                    "border-transparent text-text-2 hover:bg-surface-2/90 hover:text-text-1",
                )}
                onClick={() =>
                  onReplaceFilters({
                    ...filters,
                    type,
                  })
                }
              >
                {t(`transactions.${type}`)}
              </Button>
            ))}
          </FilterGroup>

          <FilterGroup label={t("transactions.quickPeriod")}>
            {(["all", "30d", "7d", "month"] as const).map((period) => (
              <Button
                key={period}
                type="button"
                size="sm"
                variant={filters.period === period ? "primary" : "ghost"}
                className={cn(
                  "px-2.5",
                  filters.period !== period &&
                    "border-transparent text-text-2 hover:bg-surface-2/90 hover:text-text-1",
                )}
                onClick={() =>
                  onReplaceFilters({
                    ...filters,
                    period,
                    customFrom: "",
                    customTo: "",
                  })
                }
              >
                {getPeriodLabel(period, t)}
              </Button>
            ))}
          </FilterGroup>
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="hidden flex-wrap items-center gap-1.5 border-t border-border-subtle/80 pt-2 sm:flex">
            {visibleFilterChips.map((chip) => (
              <Badge
                key={chip}
                className="min-h-0 whitespace-nowrap border-border-subtle/80 bg-surface-2/80 px-2 py-0 text-[0.64rem] font-medium text-text-2"
              >
                {chip}
              </Badge>
            ))}
            {hiddenChipCount > 0 ? (
              <span className="whitespace-nowrap text-[0.72rem] text-text-3">
                +{hiddenChipCount} {language === "id" ? "filter lain" : "more"}
              </span>
            ) : null}
            {hasActiveFilters ? (
              <button
                type="button"
                className="whitespace-nowrap text-[0.72rem] font-medium text-text-3 transition hover:text-text-1"
                onClick={onResetAll}
              >
                {t("transactions.resetAll")}
              </button>
            ) : null}
          </div>
        ) : null}
      </FilterToolbar>
    </SurfaceCard>
  );
}

interface TransactionsInsightsSectionProps {
  hasActiveFilters: boolean;
  searchSummary: TransactionSearchSummary;
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
  getDisplayLatestLabel: (
    transaction: TransactionDisplayItem | null,
    formatDate: (value: string) => string,
    t: (key: string) => string,
  ) => string;
}

export function TransactionsInsightsSection({
  hasActiveFilters,
  searchSummary,
  t,
  formatCurrency,
  formatDate,
  getDisplayLatestLabel,
}: TransactionsInsightsSectionProps) {
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <>
      <details className="group rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle bg-surface-1 sm:hidden">
        <summary className="flex list-none items-center justify-between gap-3 px-2.75 py-2">
          <div className="grid gap-0.5">
            <strong className="text-[0.82rem] font-semibold tracking-[-0.03em] text-text-1">
              {t("transactions.insightTitle")}
            </strong>
            <span className="text-[0.72rem] text-text-3">
              {formatCurrency(searchSummary.currentTotal)} / {searchSummary.count}
            </span>
          </div>
          <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
            v
          </span>
        </summary>
        <div className="border-t border-border-subtle px-2.75 py-2">
          <div className="grid gap-2">
            <div className="grid grid-cols-2 gap-2.5">
              <MetricCard
                label={t("transactions.summary.currentWindow")}
                value={formatCurrency(searchSummary.currentTotal)}
                className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
              />
              <MetricCard
                label={t("transactions.summary.last30Days")}
                value={formatCurrency(searchSummary.last30DaysTotal)}
                className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
              />
              <MetricCard
                label={t("transactions.summary.average")}
                value={formatCurrency(searchSummary.averageAmount)}
                className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
              />
              <MetricCard
                label={t("transactions.summary.count")}
                value={searchSummary.count}
                className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
              />
            </div>

            <div className="grid gap-1.5">
              <span className="text-sm text-text-3">
                {t("transactions.summary.latest")}
              </span>
              <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                {getDisplayLatestLabel(
                  searchSummary.latestTransaction,
                  formatDate,
                  t,
                )}
              </strong>
            </div>
          </div>
        </div>
      </details>

      <SurfaceCard
        padding="compact"
        className="hidden sm:block xl:sticky xl:top-[var(--page-top-space)]"
      >
        <div className="grid gap-2.5">
          <SectionHeading title={t("transactions.insightTitle")} />

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-2">
            <MetricCard
              label={t("transactions.summary.currentWindow")}
              value={formatCurrency(searchSummary.currentTotal)}
              className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("transactions.summary.last30Days")}
              value={formatCurrency(searchSummary.last30DaysTotal)}
              className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("transactions.summary.average")}
              value={formatCurrency(searchSummary.averageAmount)}
              className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("transactions.summary.count")}
              value={searchSummary.count}
              className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
            />
          </div>

          <div className="grid gap-1.5">
            <span className="text-sm text-text-3">
              {t("transactions.summary.latest")}
            </span>
            <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
              {getDisplayLatestLabel(
                searchSummary.latestTransaction,
                formatDate,
                t,
              )}
            </strong>
          </div>
        </div>
      </SurfaceCard>
    </>
  );
}

interface TransactionEditorDialogProps {
  open: boolean;
  editingTransaction: TransactionListItem | null;
  t: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TransactionEditorDialog({
  open,
  editingTransaction,
  t,
  onOpenChange,
  onSuccess,
  onCancel,
}: TransactionEditorDialogProps) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={
        editingTransaction
          ? t("transactions.form.edit")
          : t("transactions.form.new")
      }
      size="lg"
      padding="flush"
      hideClose
      headerHidden
    >
      <TransactionForm
        transaction={editingTransaction}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </ModalShell>
  );
}

interface TransactionsAdvancedFiltersDialogProps {
  open: boolean;
  filters: TransactionFilters;
  draftFilters: TransactionFilters;
  wallets: WalletOption[];
  categories: CategoryOption[];
  t: (key: string) => string;
  onOpenChange: (open: boolean) => void;
  setDraftFilters: Dispatch<SetStateAction<TransactionFilters>>;
  onApply: () => void;
}

export function TransactionsAdvancedFiltersDialog({
  open,
  filters,
  draftFilters,
  wallets,
  categories,
  t,
  onOpenChange,
  setDraftFilters,
  onApply,
}: TransactionsAdvancedFiltersDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[40rem]">
        <DialogHeader>
          <DialogTitle>{t("transactions.advancedFilters")}</DialogTitle>
        </DialogHeader>

        <FilterFieldGrid className="pt-3">
          <FilterField
            label={t("transactions.form.wallet")}
            htmlFor="filter-wallet"
          >
            <FilterSelect
              id="filter-wallet"
              value={draftFilters.walletId}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  walletId: event.target.value,
                }))
              }
            >
              <option value="">{t("transactions.filterAllWallets")}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </FilterSelect>
          </FilterField>

          <FilterField
            label={t("transactions.form.category")}
            htmlFor="filter-category"
          >
            <FilterSelect
              id="filter-category"
              value={draftFilters.categoryId}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  categoryId: event.target.value,
                }))
              }
            >
              <option value="">{t("transactions.filterAllCategories")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FilterSelect>
          </FilterField>

          <FilterField label={t("transactions.source")} htmlFor="filter-source">
            <FilterSelect
              id="filter-source"
              value={draftFilters.source}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  source: event.target.value as TransactionFilters["source"],
                }))
              }
            >
              <option value="all">{t("transactions.sources.all")}</option>
              <option value="manual">{t("transactions.sources.manual")}</option>
              <option value="quick_add">
                {t("transactions.sources.quick_add")}
              </option>
              <option value="telegram_bot">
                {t("transactions.sources.telegram_bot")}
              </option>
              <option value="system_transfer">
                {t("transactions.sources.system_transfer")}
              </option>
              <option value="wishlist_conversion">
                {t("transactions.sources.wishlist_conversion")}
              </option>
            </FilterSelect>
          </FilterField>

          <FilterField
            label={t("transactions.sort.label")}
            htmlFor="filter-sort"
          >
            <FilterSelect
              id="filter-sort"
              value={draftFilters.sort}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  sort: event.target.value as TransactionSortOption,
                }))
              }
            >
              <option value="newest">{t("transactions.sort.newest")}</option>
              <option value="oldest">{t("transactions.sort.oldest")}</option>
              <option value="highest">{t("transactions.sort.highest")}</option>
              <option value="lowest">{t("transactions.sort.lowest")}</option>
            </FilterSelect>
          </FilterField>

          <FilterField label={t("transactions.period")} htmlFor="filter-period">
            <FilterSelect
              id="filter-period"
              value={draftFilters.period}
              onChange={(event) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  period: event.target.value as TransactionPeriodFilter,
                  ...(event.target.value === "custom"
                    ? {}
                    : { customFrom: "", customTo: "" }),
                }))
              }
            >
              <option value="all">{t("transactions.periods.all")}</option>
              <option value="month">{t("transactions.periods.month")}</option>
              <option value="30d">{t("transactions.periods.30d")}</option>
              <option value="7d">{t("transactions.periods.7d")}</option>
              <option value="custom">{t("transactions.periods.custom")}</option>
            </FilterSelect>
          </FilterField>

          <FilterField
            label={t("transactions.minAmount")}
            htmlFor="filter-min-amount"
          >
            <CurrencyInput
              id="filter-min-amount"
              placeholder="0"
              value={draftFilters.minAmount}
              onValueChange={(value) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  minAmount: value,
                }))
              }
            />
          </FilterField>

          <FilterField
            label={t("transactions.maxAmount")}
            htmlFor="filter-max-amount"
          >
            <CurrencyInput
              id="filter-max-amount"
              placeholder="0"
              value={draftFilters.maxAmount}
              onValueChange={(value) =>
                setDraftFilters((currentFilters) => ({
                  ...currentFilters,
                  maxAmount: value,
                }))
              }
            />
          </FilterField>

          {draftFilters.period === "custom" ? (
            <>
              <FilterField
                label={t("transactions.fromDate")}
                htmlFor="filter-custom-from"
              >
                <Input
                  id="filter-custom-from"
                  type="date"
                  value={draftFilters.customFrom}
                  onChange={(event) =>
                    setDraftFilters((currentFilters) => ({
                      ...currentFilters,
                      customFrom: event.target.value,
                    }))
                  }
                />
              </FilterField>

              <FilterField
                label={t("transactions.toDate")}
                htmlFor="filter-custom-to"
              >
                <Input
                  id="filter-custom-to"
                  type="date"
                  value={draftFilters.customTo}
                  onChange={(event) =>
                    setDraftFilters((currentFilters) => ({
                      ...currentFilters,
                      customTo: event.target.value,
                    }))
                  }
                />
              </FilterField>
            </>
          ) : null}
        </FilterFieldGrid>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setDraftFilters({
                ...defaultTransactionFilters,
                search: filters.search,
              })
            }
          >
            {t("transactions.resetFilters")}
          </Button>
          <Button type="button" variant="primary" onClick={onApply}>
            {t("transactions.applyFilters")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TransactionsResultsSectionProps {
  isLoading: boolean;
  isError: boolean;
  displayTransactions: TransactionDisplayItem[];
  filteredTransactions: TransactionDisplayItem[];
  t: (key: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
  onEdit: (transaction: TransactionListItem) => void;
  onDelete: (id: string) => Promise<void>;
  onDeleteTransfer: (transferGroupId: string) => Promise<void>;
  onEditTransfer: (transferGroupId: string) => void;
  deleteTransactionPending: boolean;
  deleteTransferPending: boolean;
}

export function TransactionsResultsSection({
  isLoading,
  isError,
  displayTransactions,
  filteredTransactions,
  t,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
  onDeleteTransfer,
  onEditTransfer,
  deleteTransactionPending,
  deleteTransferPending,
}: TransactionsResultsSectionProps) {
  return (
    <SurfaceCard
      padding="none"
      className="overflow-hidden rounded-none border-transparent bg-transparent shadow-none sm:rounded-[var(--radius-card)] sm:border-border-subtle sm:bg-surface-1 sm:shadow-xs"
    >
      {isLoading ? (
        <div className="p-[var(--space-panel-tight)] lg:p-[var(--space-panel)]">
          <EmptyState title={t("common.loading")} compact />
        </div>
      ) : isError ? (
        <div className="p-[var(--space-panel-tight)] lg:p-[var(--space-panel)]">
          <EmptyState title={t("transactions.loadError")} compact />
        </div>
      ) : displayTransactions.length === 0 ? (
        <div className="p-[var(--space-panel-tight)] lg:p-[var(--space-panel)]">
          <EmptyState
            title={t("transactions.emptyTitle")}
            icon={<ReceiptText size={20} />}
          />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="p-[var(--space-panel-tight)] lg:p-[var(--space-panel)]">
          <EmptyState
            title={t("transactions.noResults")}
            icon={<Search size={20} />}
          />
        </div>
      ) : (
        <div className="divide-y divide-border-subtle/80">
          {filteredTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              t={t}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              onEdit={onEdit}
              onDelete={onDelete}
              onDeleteTransfer={onDeleteTransfer}
              onEditTransfer={onEditTransfer}
              deleteTransactionPending={deleteTransactionPending}
              deleteTransferPending={deleteTransferPending}
            />
          ))}
        </div>
      )}
    </SurfaceCard>
  );
}

interface TransactionsInsightsLayoutProps {
  hasActiveFilters: boolean;
  children: React.ReactNode;
}

export function TransactionsInsightsLayout({
  hasActiveFilters,
  children,
}: TransactionsInsightsLayoutProps) {
  return (
    <section
      className={cn(
        "grid gap-3",
        hasActiveFilters &&
          "xl:grid-cols-[minmax(0,1.5fr)_minmax(18.5rem,0.5fr)] xl:items-start 2xl:grid-cols-[minmax(0,1.62fr)_minmax(20rem,0.46fr)]",
      )}
    >
      {children}
    </section>
  );
}

