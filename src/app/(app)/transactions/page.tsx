'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { endOfDay, isSameMonth, parseISO, startOfDay, subDays } from 'date-fns';
import { Suspense, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Download, Filter, ReceiptText, RotateCcw, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import TransactionForm from '@/components/TransactionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
  Toolbar,
} from '@/components/shared/PagePrimitives';
import { TransactionRow } from '@/components/transactions/TransactionRow';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import {
  buildTransactionCsvContent,
  buildTransactionCsvRows,
  downloadCsvFile,
} from '@/lib/export/csv';
import { queryKeys } from '@/lib/queries/keys';
import {
  buildTransactionDisplayItems,
  getTransactionDisplayDate,
  getTransactionSearchText,
  getTransactionSummaryAmount,
  type TransactionDisplayItem,
} from '@/lib/transactionFeed';
import { fetchActiveWallets, fetchCategories } from '@/lib/queries/reference';
import {
  defaultTransactionFilters,
  fetchTransactions,
  type TransactionFilters,
  type TransactionListItem,
  type TransactionPeriodFilter,
  type TransactionSortOption,
} from '@/lib/queries/transactions';
import { createClient } from '@/lib/supabase/client';
import {
  parseTransactionUrlState,
  serializeTransactionUrlState,
  transactionFiltersToUrlState,
  transactionUrlStateToFilters,
} from '@/lib/url-state';
import { cn } from '@/lib/utils';

type TransactionSearchSummary = {
  allTimeTotal: number;
  last30DaysTotal: number;
  last7DaysTotal: number;
  currentTotal: number;
  averageAmount: number;
  count: number;
  latestTransaction: TransactionDisplayItem | null;
};

const MIN_DATE_STRING_LENGTH = 10;
const FILTER_CHIP_PREVIEW_COUNT = 2;
const selectClassName =
  'flex min-h-[3rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

function getTransactionDate(transaction: TransactionDisplayItem) {
  return parseISO(getTransactionDisplayDate(transaction));
}

function matchesSearch(transaction: TransactionDisplayItem, search: string) {
  if (!search) {
    return true;
  }

  return getTransactionSearchText(transaction).includes(search.toLowerCase());
}

function matchesPeriod(transaction: TransactionDisplayItem, filters: TransactionFilters) {
  if (filters.period === 'all') {
    return true;
  }

  const transactionDate = getTransactionDate(transaction);
  const today = new Date();

  if (filters.period === 'month') {
    return isSameMonth(transactionDate, today);
  }

  if (filters.period === '30d') {
    return transactionDate >= startOfDay(subDays(today, 29));
  }

  if (filters.period === '7d') {
    return transactionDate >= startOfDay(subDays(today, 6));
  }

  if (filters.period === 'custom') {
    const fromDate =
      filters.customFrom.length >= MIN_DATE_STRING_LENGTH ? startOfDay(parseISO(filters.customFrom)) : null;
    const toDate =
      filters.customTo.length >= MIN_DATE_STRING_LENGTH ? endOfDay(parseISO(filters.customTo)) : null;

    if (fromDate && transactionDate < fromDate) {
      return false;
    }

    if (toDate && transactionDate > toDate) {
      return false;
    }
  }

  return true;
}

function matchesCoreFilters(transaction: TransactionDisplayItem, filters: TransactionFilters) {
  const minAmount = Number(filters.minAmount || 0);
  const maxAmount = Number(filters.maxAmount || 0);

  if (transaction.kind === 'transfer') {
    if (filters.type === 'income' || filters.type === 'expense') {
      return false;
    }

    if (filters.walletId && transaction.fromWalletId !== filters.walletId && transaction.toWalletId !== filters.walletId) {
      return false;
    }

    if (filters.categoryId) {
      return false;
    }

    if (filters.source !== 'all' && filters.source !== 'system_transfer') {
      return false;
    }

    if (filters.search && !matchesSearch(transaction, filters.search)) {
      return false;
    }

    if (filters.minAmount && transaction.amount < minAmount) {
      return false;
    }

    if (filters.maxAmount && transaction.amount > maxAmount) {
      return false;
    }

    return true;
  }

  const isTransfer = transaction.source === 'system_transfer';

  if (filters.type === 'transfer' && !isTransfer) {
    return false;
  }

  if (filters.type === 'income' && (transaction.type !== 'income' || isTransfer)) {
    return false;
  }

  if (filters.type === 'expense' && (transaction.type !== 'expense' || isTransfer)) {
    return false;
  }

  if (filters.walletId && transaction.wallet_id !== filters.walletId) {
    return false;
  }

  if (filters.categoryId && transaction.category_id !== filters.categoryId) {
    return false;
  }

  if (filters.source !== 'all' && transaction.source !== filters.source) {
    return false;
  }

  if (filters.search && !matchesSearch(transaction, filters.search)) {
    return false;
  }

  if (filters.minAmount && transaction.amount < minAmount) {
    return false;
  }

  if (filters.maxAmount && transaction.amount > maxAmount) {
    return false;
  }

  return true;
}

function sortTransactions(transactions: TransactionDisplayItem[], sort: TransactionSortOption) {
  const sortedTransactions = [...transactions];

  sortedTransactions.sort((left, right) => {
    if (sort === 'oldest') {
      return getTransactionDate(left).getTime() - getTransactionDate(right).getTime();
    }

    if (sort === 'highest') {
      return right.amount - left.amount;
    }

    if (sort === 'lowest') {
      return left.amount - right.amount;
    }

    return getTransactionDate(right).getTime() - getTransactionDate(left).getTime();
  });

  return sortedTransactions;
}

function getSummarySource(filters: TransactionFilters) {
  if (filters.type === 'income') {
    return 'income';
  }

  if (filters.type === 'transfer' || filters.source === 'system_transfer') {
    return 'transfer';
  }

  return 'expense';
}

function buildSearchSummary(
  transactions: TransactionDisplayItem[],
  filters: TransactionFilters,
  visibleTransactions: TransactionDisplayItem[]
): TransactionSearchSummary {
  const summarySource = getSummarySource(filters);
  const today = new Date();
  const last30Boundary = startOfDay(subDays(today, 29));
  const last7Boundary = startOfDay(subDays(today, 6));

  const eligibleTransactions = transactions.filter(
    (transaction) => getTransactionSummaryAmount(transaction, summarySource) > 0
  );
  const visibleEligibleTransactions = visibleTransactions.filter(
    (transaction) => getTransactionSummaryAmount(transaction, summarySource) > 0
  );

  const allTimeTotal = eligibleTransactions.reduce(
    (total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource),
    0
  );
  const last30DaysTotal = eligibleTransactions
    .filter((transaction) => getTransactionDate(transaction) >= last30Boundary)
    .reduce((total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource), 0);
  const last7DaysTotal = eligibleTransactions
    .filter((transaction) => getTransactionDate(transaction) >= last7Boundary)
    .reduce((total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource), 0);
  const currentTotal = visibleEligibleTransactions.reduce(
    (total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource),
    0
  );
  const latestTransaction = visibleEligibleTransactions[0] ?? eligibleTransactions[0] ?? null;

  return {
    allTimeTotal,
    last30DaysTotal,
    last7DaysTotal,
    currentTotal,
    count: visibleTransactions.length,
    averageAmount:
      visibleEligibleTransactions.length > 0 ? Math.round(currentTotal / visibleEligibleTransactions.length) : 0,
    latestTransaction,
  };
}

function getSourceLabel(
  source: 'manual' | 'quick_add' | 'telegram_bot' | 'system_transfer' | 'wishlist_conversion',
  t: (path: string) => string
) {
  return t(`transactions.sources.${source}`);
}

function getPeriodLabel(period: TransactionPeriodFilter, t: (path: string) => string) {
  return t(`transactions.periods.${period}`);
}

function getDisplayTitle(transaction: TransactionDisplayItem, t: (path: string) => string) {
  if (transaction.kind === 'transfer') {
    return transaction.title;
  }

  return transaction.title || transaction.note || t('common.noNote');
}

function getDisplayLatestLabel(
  transaction: TransactionDisplayItem | null,
  formatDate: (value: string) => string,
  t: (path: string) => string
) {
  if (!transaction) {
    return t('transactions.summary.noLatest');
  }

  return `${getDisplayTitle(transaction, t)} - ${formatDate(getTransactionDisplayDate(transaction))}`;
}

function isFilterStateDirty(filters: TransactionFilters) {
  return (
    filters.type !== defaultTransactionFilters.type ||
    filters.walletId !== defaultTransactionFilters.walletId ||
    filters.categoryId !== defaultTransactionFilters.categoryId ||
    filters.period !== defaultTransactionFilters.period ||
    filters.customFrom !== defaultTransactionFilters.customFrom ||
    filters.customTo !== defaultTransactionFilters.customTo ||
    filters.source !== defaultTransactionFilters.source ||
    filters.minAmount !== defaultTransactionFilters.minAmount ||
    filters.maxAmount !== defaultTransactionFilters.maxAmount ||
    filters.sort !== defaultTransactionFilters.sort
  );
}

function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { t, language } = useLanguage();
  const { currencyCode, formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionListItem | null>(null);
  const filters = transactionUrlStateToFilters(parseTransactionUrlState(searchParams));
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(() => filters);

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list('all-records'),
    queryFn: fetchTransactions,
  });

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list('all'),
    queryFn: () => fetchCategories(),
  });

  useEffect(() => {
    const handleTransactionsChanged = () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
  }, [queryClient]);

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('transactions.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('transactions.deleteError')));
    },
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (transferGroupId: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc('soft_delete_transfer_group', {
        p_transfer_group_id: transferGroupId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('transfers.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('transfers.deleteError')));
    },
  });

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('transactions.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    deleteTransactionMutation.mutate(id);
  };

  const handleDeleteTransfer = async (transferGroupId: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('transfers.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    deleteTransferMutation.mutate(transferGroupId);
  };

  const handleEdit = (transaction: TransactionListItem) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const replaceTransactionState = (nextFilters: TransactionFilters) => {
    const nextQueryString = serializeTransactionUrlState(transactionFiltersToUrlState(nextFilters));
    const currentQueryString = searchParamsKey;

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  };

  const handleResetAll = () => {
    setDraftFilters(defaultTransactionFilters);
    replaceTransactionState(defaultTransactionFilters);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const transactions = transactionsQuery.data ?? [];
  const displayTransactions = buildTransactionDisplayItems(transactions);
  const baseFilteredTransactions = displayTransactions.filter((transaction) =>
    matchesCoreFilters(transaction, filters)
  );
  const filteredTransactions = sortTransactions(
    baseFilteredTransactions.filter((transaction) => matchesPeriod(transaction, filters)),
    filters.sort
  );

  const hasActiveFilters = Boolean(filters.search) || isFilterStateDirty(filters);
  const searchSummary = buildSearchSummary(baseFilteredTransactions, filters, filteredTransactions);

  const activeFilterChips = [
    filters.search ? `${t('transactions.search')}: ${filters.search}` : null,
    filters.type !== 'all' ? t(`transactions.${filters.type}`) : null,
    filters.period !== 'all' ? getPeriodLabel(filters.period, t) : null,
    filters.walletId
      ? walletsQuery.data?.find((wallet) => wallet.id === filters.walletId)?.name ?? null
      : null,
    filters.categoryId
      ? categoriesQuery.data?.find((category) => category.id === filters.categoryId)?.name ?? null
      : null,
    filters.source !== 'all' ? getSourceLabel(filters.source, t) : null,
    filters.minAmount ? `${t('transactions.minAmount')} ${formatCurrency(Number(filters.minAmount))}` : null,
    filters.maxAmount ? `${t('transactions.maxAmount')} ${formatCurrency(Number(filters.maxAmount))}` : null,
    filters.sort !== 'newest' ? t(`transactions.sort.${filters.sort}`) : null,
  ].filter(Boolean) as string[];
  const visibleFilterChips = activeFilterChips.slice(0, FILTER_CHIP_PREVIEW_COUNT);
  const hiddenChipCount = Math.max(0, activeFilterChips.length - visibleFilterChips.length);
  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      toast.error(t('transactions.exportEmpty'));
      return;
    }

    try {
      const csvRows = buildTransactionCsvRows(filteredTransactions, currencyCode);
      const csvContent = buildTransactionCsvContent(csvRows);
      const dateStamp = new Date().toISOString().split('T')[0];
      downloadCsvFile(`duitflow-transactions-${dateStamp}.csv`, csvContent);
    } catch (error) {
      toast.error(getErrorMessage(error, t('transactions.exportError')));
    }
  };

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading
          eyebrow="Ledger"
          title={t('transactions.title')}
        />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={handleExportCsv}
            disabled={transactionsQuery.isLoading || filteredTransactions.length === 0}
          >
            <Download size={16} />
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">{t('transactions.exportCsv')}</span>
          </Button>
          <Button type="button" variant="secondary" size="sm" className="max-sm:min-w-max" onClick={() => router.push('/transfer')}>
            <ArrowLeftRight size={16} />
            {t('transfers.addTransfer')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
          >
            {t('transactions.addTransaction')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section className={cn('grid gap-3.5', hasActiveFilters && 'xl:grid-cols-[minmax(0,1.18fr)_minmax(19rem,0.82fr)] xl:items-start')}>
        <SurfaceCard className="sticky top-[3.65rem] z-20 sm:static">
          <div className="grid gap-3">
            <Toolbar className="items-stretch border-0 bg-transparent p-0 shadow-none sm:flex-col sm:items-stretch sm:justify-start xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center xl:gap-3">
              <label
                htmlFor="transaction-search"
                className="flex min-h-[2.95rem] items-center gap-3 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/55 px-3.5 transition-all duration-300 focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft/70 sm:min-h-[3.15rem] sm:px-4"
              >
                <Search size={18} className="text-text-3" />
                <Input
                  id="transaction-search"
                  type="search"
                  value={filters.search}
                  onChange={(event) =>
                    replaceTransactionState({
                      ...filters,
                      search: event.target.value,
                    })
                  }
                  placeholder={t('transactions.searchPlaceholder')}
                  className="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus:ring-0"
                />
                {filters.search ? (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-3 transition hover:bg-surface-1 hover:text-text-1"
                    onClick={() =>
                      replaceTransactionState({
                        ...filters,
                        search: '',
                      })
                    }
                    aria-label={t('transactions.clearSearch')}
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </label>

              <div className="flex gap-2 max-sm:overflow-x-auto max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="max-sm:min-w-max"
                  onClick={() => {
                    setDraftFilters(filters);
                    setIsFilterOpen(true);
                  }}
                >
                  <Filter size={16} />
                  {t('transactions.advancedFilters')}
                </Button>
                {hasActiveFilters ? (
                  <Button type="button" variant="ghost" size="sm" className="max-sm:min-w-max" onClick={handleResetAll}>
                    <RotateCcw size={16} />
                    {t('transactions.resetAll')}
                  </Button>
                ) : null}
              </div>
            </Toolbar>

            <div className="grid gap-3">
              <FilterGroup label={t('transactions.quickType')}>
                {(['all', 'expense', 'income', 'transfer'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={filters.type === type ? 'primary' : 'secondary'}
                    onClick={() =>
                      replaceTransactionState({
                        ...filters,
                        type,
                      })
                    }
                  >
                    {t(`transactions.${type}`)}
                  </Button>
                ))}
              </FilterGroup>

              <FilterGroup label={t('transactions.quickPeriod')}>
                {(['all', '30d', '7d', 'month'] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={filters.period === period ? 'primary' : 'secondary'}
                    onClick={() =>
                      replaceTransactionState({
                        ...filters,
                        period,
                        customFrom: '',
                        customTo: '',
                      })
                    }
                  >
                    {getPeriodLabel(period, t)}
                  </Button>
                ))}
              </FilterGroup>
            </div>

            {activeFilterChips.length > 0 ? (
              <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {visibleFilterChips.map((chip) => (
                  <Badge key={chip} className="bg-surface-2 text-text-2 whitespace-nowrap">
                    {chip}
                  </Badge>
                ))}
                {hiddenChipCount > 0 ? (
                  <span className="whitespace-nowrap text-sm text-text-3">
                    +{hiddenChipCount} {language === 'id' ? 'filter lain' : 'more'}
                  </span>
                ) : null}
                {hasActiveFilters ? (
                  <button
                    type="button"
                    className="whitespace-nowrap text-sm font-medium text-text-3 transition hover:text-text-1"
                    onClick={handleResetAll}
                  >
                    {t('transactions.resetAll')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        {hasActiveFilters ? (
          <>
            <details className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 sm:hidden">
              <summary className="flex list-none items-center justify-between gap-3 px-3.5 py-3">
                <div className="grid gap-0.5">
                  <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{t('transactions.insightTitle')}</strong>
                  <span className="text-xs text-text-3">
                    {t('transactions.summary.count')}: {searchSummary.count}
                  </span>
                </div>
                <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">v</span>
              </summary>
              <div className="border-t border-border-subtle px-3.5 py-3">
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <MetricCard
                      label={t('transactions.summary.currentWindow')}
                      value={formatCurrency(searchSummary.currentTotal)}
                    />
                    <MetricCard
                      label={t('transactions.summary.last30Days')}
                      value={formatCurrency(searchSummary.last30DaysTotal)}
                    />
                    <MetricCard
                      label={t('transactions.summary.average')}
                      value={formatCurrency(searchSummary.averageAmount)}
                    />
                    <MetricCard label={t('transactions.summary.count')} value={searchSummary.count} />
                  </div>

                  <div className="grid gap-1.5">
                    <span className="text-sm text-text-3">{t('transactions.summary.latest')}</span>
                    <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                      {getDisplayLatestLabel(searchSummary.latestTransaction, formatDate, t)}
                    </strong>
                  </div>
                </div>
              </div>
            </details>

            <SurfaceCard className="hidden sm:block xl:sticky xl:top-4">
              <div className="grid gap-4">
                <SectionHeading title={t('transactions.insightTitle')} />

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
                  <MetricCard
                    label={t('transactions.summary.currentWindow')}
                    value={formatCurrency(searchSummary.currentTotal)}
                  />
                  <MetricCard
                    label={t('transactions.summary.last30Days')}
                    value={formatCurrency(searchSummary.last30DaysTotal)}
                  />
                  <MetricCard
                    label={t('transactions.summary.average')}
                    value={formatCurrency(searchSummary.averageAmount)}
                  />
                  <MetricCard label={t('transactions.summary.count')} value={searchSummary.count} />
                </div>

                <div className="grid gap-1.5">
                  <span className="text-sm text-text-3">{t('transactions.summary.latest')}</span>
                  <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                    {getDisplayLatestLabel(searchSummary.latestTransaction, formatDate, t)}
                  </strong>
                </div>
              </div>
            </SurfaceCard>
          </>
        ) : null}
      </section>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
      >
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{editingTransaction ? t('transactions.form.edit') : t('transactions.form.new')}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isFilterOpen}
        onOpenChange={(open) => {
          if (open) {
            setDraftFilters(filters);
          }
          setIsFilterOpen(open);
        }}
      >
        <DialogContent className="max-w-[40rem]">
          <DialogHeader>
            <DialogTitle>{t('transactions.advancedFilters')}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 pt-3 md:grid-cols-2">
            <FilterField label={t('transactions.form.wallet')} htmlFor="filter-wallet">
              <select
                id="filter-wallet"
                className={selectClassName}
                value={draftFilters.walletId}
                onChange={(event) =>
                  setDraftFilters((currentFilters) => ({
                    ...currentFilters,
                    walletId: event.target.value,
                  }))
                }
              >
                <option value="">{t('transactions.filterAllWallets')}</option>
                {(walletsQuery.data ?? []).map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label={t('transactions.form.category')} htmlFor="filter-category">
              <select
                id="filter-category"
                className={selectClassName}
                value={draftFilters.categoryId}
                onChange={(event) =>
                  setDraftFilters((currentFilters) => ({
                    ...currentFilters,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">{t('transactions.filterAllCategories')}</option>
                {(categoriesQuery.data ?? []).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </FilterField>

            <FilterField label={t('transactions.source')} htmlFor="filter-source">
              <select
                id="filter-source"
                className={selectClassName}
                value={draftFilters.source}
                onChange={(event) =>
                  setDraftFilters((currentFilters) => ({
                    ...currentFilters,
                    source: event.target.value as TransactionFilters['source'],
                  }))
                }
              >
                <option value="all">{t('transactions.sources.all')}</option>
                <option value="manual">{t('transactions.sources.manual')}</option>
                <option value="quick_add">{t('transactions.sources.quick_add')}</option>
                <option value="telegram_bot">{t('transactions.sources.telegram_bot')}</option>
                <option value="system_transfer">{t('transactions.sources.system_transfer')}</option>
                <option value="wishlist_conversion">{t('transactions.sources.wishlist_conversion')}</option>
              </select>
            </FilterField>

            <FilterField label={t('transactions.sort.label')} htmlFor="filter-sort">
              <select
                id="filter-sort"
                className={selectClassName}
                value={draftFilters.sort}
                onChange={(event) =>
                  setDraftFilters((currentFilters) => ({
                    ...currentFilters,
                    sort: event.target.value as TransactionSortOption,
                  }))
                }
              >
                <option value="newest">{t('transactions.sort.newest')}</option>
                <option value="oldest">{t('transactions.sort.oldest')}</option>
                <option value="highest">{t('transactions.sort.highest')}</option>
                <option value="lowest">{t('transactions.sort.lowest')}</option>
              </select>
            </FilterField>

            <FilterField label={t('transactions.period')} htmlFor="filter-period">
              <select
                id="filter-period"
                className={selectClassName}
                value={draftFilters.period}
                onChange={(event) =>
                  setDraftFilters((currentFilters) => ({
                    ...currentFilters,
                    period: event.target.value as TransactionPeriodFilter,
                    ...(event.target.value === 'custom'
                      ? {}
                      : { customFrom: '', customTo: '' }),
                  }))
                }
              >
                <option value="all">{t('transactions.periods.all')}</option>
                <option value="month">{t('transactions.periods.month')}</option>
                <option value="30d">{t('transactions.periods.30d')}</option>
                <option value="7d">{t('transactions.periods.7d')}</option>
                <option value="custom">{t('transactions.periods.custom')}</option>
              </select>
            </FilterField>

            <FilterField label={t('transactions.minAmount')} htmlFor="filter-min-amount">
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

            <FilterField label={t('transactions.maxAmount')} htmlFor="filter-max-amount">
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

            {draftFilters.period === 'custom' ? (
              <>
                <FilterField label={t('transactions.fromDate')} htmlFor="filter-custom-from">
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

                <FilterField label={t('transactions.toDate')} htmlFor="filter-custom-to">
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
          </div>

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
              {t('transactions.resetFilters')}
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                replaceTransactionState({
                  ...draftFilters,
                  search: filters.search,
                });
                setIsFilterOpen(false);
              }}
            >
              {t('transactions.applyFilters')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SurfaceCard>
        {transactionsQuery.isLoading ? (
          <EmptyState title={t('common.loading')} compact />
        ) : transactionsQuery.isError ? (
          <EmptyState title={t('transactions.loadError')} compact />
        ) : displayTransactions.length === 0 ? (
          <EmptyState
            title={t('transactions.emptyTitle')}
            icon={<ReceiptText size={20} />}
          />
        ) : filteredTransactions.length === 0 ? (
          <EmptyState
            title={t('transactions.noResults')}
            icon={<Search size={20} />}
          />
        ) : (
          <div className="grid gap-3">
            {filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                t={t}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDeleteTransfer={handleDeleteTransfer}
                onEditTransfer={(transferGroupId) => router.push(`/transfer?edit=${transferGroupId}`)}
                deleteTransactionPending={deleteTransactionMutation.isPending}
                deleteTransferPending={deleteTransferMutation.isPending}
              />
            ))}
          </div>
        )}
      </SurfaceCard>
    </PageShell>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="animate-fade-in">
          <PageHeader>
            <PageHeading title="Transactions" />
          </PageHeader>
          <SurfaceCard>
            <EmptyState title="Loading..." compact />
          </SurfaceCard>
        </PageShell>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
      <span className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-text-3 md:text-sm md:font-medium md:normal-case md:tracking-normal">{label}</span>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0">
        {children}
      </div>
    </div>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-text-3" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

