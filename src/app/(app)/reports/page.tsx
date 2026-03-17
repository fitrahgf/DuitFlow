'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { differenceInCalendarDays, endOfDay, isSameMonth, parseISO, startOfDay, subDays } from 'date-fns';
import { Suspense, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, PieChart, RotateCcw, Search, TrendingUp, Wallet } from 'lucide-react';
import { CategoryDoughnutChart, TransactionBarChart } from '@/components/Chart';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { queryKeys } from '@/lib/queries/keys';
import { fetchReportsOverview, type ReportTransaction } from '@/lib/queries/reports';
import { fetchCategories } from '@/lib/queries/reference';
import { parseReportsUrlState, serializeReportsUrlState, type ReportsUrlState } from '@/lib/url-state';
import { cn } from '@/lib/utils';

type ReportPeriodFilter = 'all' | 'month' | '30d' | '7d' | 'custom';

interface ReportFilters {
  period: ReportPeriodFilter;
  walletId: string;
  categoryId: string;
  customFrom: string;
  customTo: string;
}

const defaultReportFilters: ReportFilters = {
  period: 'month',
  walletId: '',
  categoryId: '',
  customFrom: '',
  customTo: '',
};

const nativeSelectClassName =
  'flex min-h-[3rem] w-full rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

function getTransactionDateValue(transaction: ReportTransaction) {
  return transaction.transaction_date || transaction.date;
}

function getTransactionDate(transaction: ReportTransaction) {
  return parseISO(getTransactionDateValue(transaction));
}

function getKeywordSearchText(transaction: ReportTransaction) {
  return [transaction.title, transaction.note, transaction.categories?.name, transaction.wallets?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function matchesStaticFilters(transaction: ReportTransaction, filters: ReportFilters) {
  if (filters.walletId && transaction.wallet_id !== filters.walletId) {
    return false;
  }

  if (filters.categoryId && transaction.category_id !== filters.categoryId) {
    return false;
  }

  return true;
}

function matchesPeriod(transaction: ReportTransaction, filters: ReportFilters) {
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

  if (filters.customFrom) {
    const fromDate = startOfDay(parseISO(filters.customFrom));
    if (transactionDate < fromDate) {
      return false;
    }
  }

  if (filters.customTo) {
    const toDate = endOfDay(parseISO(filters.customTo));
    if (transactionDate > toDate) {
      return false;
    }
  }

  return true;
}

function getPeriodLabel(period: ReportPeriodFilter, t: (key: string) => string) {
  return t(`reports.periods.${period}`);
}

function ReportsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const urlState = parseReportsUrlState(searchParams);
  const filters: ReportFilters = {
    period: urlState.period,
    walletId: urlState.wallet,
    categoryId: urlState.category,
    customFrom: urlState.from,
    customTo: urlState.to,
  };
  const deferredKeyword = urlState.keyword.toLowerCase();

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports.overview,
    queryFn: fetchReportsOverview,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list('all'),
    queryFn: () => fetchCategories(),
  });

  useEffect(() => {
    const handleTransactionsChanged = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.reports.overview });
    };

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
  }, [queryClient]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const transactions = reportsQuery.data?.transactions ?? [];
  const wallets = reportsQuery.data?.wallets ?? [];
  const categories = categoriesQuery.data ?? [];
  const analyticsTransactions = transactions.filter((transaction) => transaction.source !== 'system_transfer');
  const scopedTransactions = analyticsTransactions.filter((transaction) => matchesStaticFilters(transaction, filters));
  const visibleTransactions = scopedTransactions.filter((transaction) => matchesPeriod(transaction, filters));
  const visibleIncomeTransactions = visibleTransactions.filter((transaction) => transaction.type === 'income');
  const visibleExpenseTransactions = visibleTransactions.filter((transaction) => transaction.type === 'expense');

  const totalIncome = visibleIncomeTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = visibleExpenseTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  const netFlow = totalIncome - totalExpense;
  const totalBalance = wallets
    .filter((wallet) => wallet.is_active && !wallet.is_archived)
    .reduce((sum, wallet) => sum + wallet.balance, 0);

  const categoryTotalsMap = new Map<string, { total: number; color: string }>();
  visibleExpenseTransactions.forEach((transaction) => {
    const categoryName = transaction.categories?.name || t('common.uncategorized');
    const categoryColor = transaction.categories?.color || '#94a3b8';
    const current = categoryTotalsMap.get(categoryName) ?? { total: 0, color: categoryColor };
    current.total += transaction.amount;
    categoryTotalsMap.set(categoryName, current);
  });

  const categoryRows = [...categoryTotalsMap.entries()]
    .map(([name, value]) => ({
      name,
      total: value.total,
      color: value.color,
    }))
    .sort((left, right) => right.total - left.total);

  const trendLabels: string[] = [];
  const trendIncome: number[] = [];
  const trendExpense: number[] = [];
  for (let offset = 5; offset >= 0; offset -= 1) {
    const monthDate = new Date();
    monthDate.setDate(1);
    monthDate.setMonth(monthDate.getMonth() - offset);

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const label = monthDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      month: 'short',
    });

    const monthIncome = scopedTransactions
      .filter((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        return transaction.type === 'income' && transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const monthExpense = scopedTransactions
      .filter((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        return transaction.type === 'expense' && transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    trendLabels.push(label);
    trendIncome.push(monthIncome);
    trendExpense.push(monthExpense);
  }

  const topCategory = categoryRows[0] ?? null;
  const walletActivityMap = new Map<string, { name: string; count: number }>();
  visibleTransactions.forEach((transaction) => {
    if (!transaction.wallet_id) {
      return;
    }

    const current = walletActivityMap.get(transaction.wallet_id) ?? {
      name: transaction.wallets?.name || t('transactions.unknownWallet'),
      count: 0,
    };
    current.count += 1;
    walletActivityMap.set(transaction.wallet_id, current);
  });

  const mostActiveWallet =
    [...walletActivityMap.values()].sort((left, right) => right.count - left.count)[0] ?? null;

  let windowDayCount = 0;
  if (filters.period === '7d') {
    windowDayCount = 7;
  } else if (filters.period === '30d') {
    windowDayCount = 30;
  } else if (filters.period === 'month') {
    const start = startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    windowDayCount = differenceInCalendarDays(new Date(), start) + 1;
  } else if (filters.period === 'custom' && filters.customFrom && filters.customTo) {
    windowDayCount = differenceInCalendarDays(parseISO(filters.customTo), parseISO(filters.customFrom)) + 1;
  } else if (visibleTransactions.length > 0) {
    const dates = visibleTransactions.map((transaction) => getTransactionDate(transaction));
    const sortedDates = [...dates].sort((left, right) => left.getTime() - right.getTime());
    windowDayCount =
      differenceInCalendarDays(sortedDates[sortedDates.length - 1], sortedDates[0]) + 1;
  }

  const averageDailyExpense = windowDayCount > 0 ? Math.round(totalExpense / windowDayCount) : 0;

  const keywordMatches = deferredKeyword
    ? scopedTransactions.filter(
        (transaction) => transaction.type === 'expense' && getKeywordSearchText(transaction).includes(deferredKeyword)
      )
    : [];
  const keywordVisibleMatches = keywordMatches.filter((transaction) => matchesPeriod(transaction, filters));
  const last30Boundary = startOfDay(subDays(new Date(), 29));
  const keywordLast30Total = keywordMatches
    .filter((transaction) => getTransactionDate(transaction) >= last30Boundary)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const keywordCurrentTotal = keywordVisibleMatches.reduce((sum, transaction) => sum + transaction.amount, 0);
  const keywordAverage = keywordVisibleMatches.length > 0 ? Math.round(keywordCurrentTotal / keywordVisibleMatches.length) : 0;
  const keywordLatest = keywordVisibleMatches[0] ?? keywordMatches[0] ?? null;

  const filterGridClassName =
    filters.period === 'custom'
      ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-4'
      : 'grid gap-4 md:grid-cols-2 xl:grid-cols-2';
  const replaceReportsState = (nextState: ReportsUrlState) => {
    const nextQueryString = serializeReportsUrlState(nextState);
    const currentQueryString = searchParams.toString();

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('reports.title')} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() =>
              replaceReportsState({
                period: defaultReportFilters.period,
                wallet: '',
                category: '',
                from: '',
                to: '',
                keyword: '',
              })
            }
          >
            <RotateCcw size={16} />
            {t('reports.reset')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard className="sticky top-[3.65rem] z-20 sm:static">
        <div className="grid gap-3">
          <Toolbar className="items-stretch border-0 bg-transparent p-0 shadow-none">
            <FilterGroup label={t('reports.filters.period')}>
              {(['month', '30d', '7d', 'all', 'custom'] as const).map((period) => (
                <Button
                  key={period}
                  type="button"
                  size="sm"
                  variant={filters.period === period ? 'primary' : 'ghost'}
                  onClick={() =>
                    replaceReportsState({
                      ...urlState,
                      period,
                      from: period === 'custom' ? urlState.from : '',
                      to: period === 'custom' ? urlState.to : '',
                    })
                  }
                >
                  {getPeriodLabel(period, t)}
                </Button>
              ))}
            </FilterGroup>

            <div className={cn(filterGridClassName, 'gap-3')}>
              <FilterField label={t('reports.filters.wallet')} htmlFor="reports-wallet">
                <select
                  id="reports-wallet"
                  className={nativeSelectClassName}
                  value={filters.walletId}
                  onChange={(event) =>
                    replaceReportsState({
                      ...urlState,
                      wallet: event.target.value,
                    })
                  }
                >
                  <option value="">{t('reports.filters.allWallets')}</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label={t('reports.filters.category')} htmlFor="reports-category">
                <select
                  id="reports-category"
                  className={nativeSelectClassName}
                  value={filters.categoryId}
                  onChange={(event) =>
                    replaceReportsState({
                      ...urlState,
                      category: event.target.value,
                    })
                  }
                >
                  <option value="">{t('reports.filters.allCategories')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FilterField>

              {filters.period === 'custom' ? (
                <>
                  <FilterField label={t('reports.filters.fromDate')} htmlFor="reports-custom-from">
                    <Input
                      id="reports-custom-from"
                      type="date"
                      value={filters.customFrom}
                      onChange={(event) =>
                        replaceReportsState({
                          ...urlState,
                          from: event.target.value,
                        })
                      }
                    />
                  </FilterField>
                  <FilterField label={t('reports.filters.toDate')} htmlFor="reports-custom-to">
                    <Input
                      id="reports-custom-to"
                      type="date"
                      value={filters.customTo}
                      onChange={(event) =>
                        replaceReportsState({
                          ...urlState,
                          to: event.target.value,
                        })
                      }
                    />
                  </FilterField>
                </>
              ) : null}
            </div>
          </Toolbar>

        </div>
      </SurfaceCard>

      {reportsQuery.isLoading ? (
        <SurfaceCard>
          <EmptyState title={t('common.loading')} compact />
        </SurfaceCard>
      ) : reportsQuery.isError ? (
        <SurfaceCard>
          <EmptyState title={t('reports.loadError')} compact />
        </SurfaceCard>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label={t('reports.summary.income')} value={formatCurrency(totalIncome)} tone="success" />
            <MetricCard label={t('reports.summary.expense')} value={formatCurrency(totalExpense)} tone="danger" />
            <MetricCard label={t('reports.summary.net')} value={formatCurrency(netFlow)} tone="accent" />
            <MetricCard label={t('reports.summary.balance')} value={formatCurrency(totalBalance)} />
          </section>

          <details className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 sm:hidden">
            <summary className="flex list-none items-center justify-between gap-3 px-3.5 py-3">
              <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{language === 'id' ? 'Charts & insight' : 'Charts & insights'}</strong>
              <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">v</span>
            </summary>
            <div className="grid gap-3 border-t border-border-subtle px-3.5 py-3">
              <section className="grid gap-3">
                <SurfaceCard>
                  <div className="grid gap-3">
                    <SectionHeading title={t('reports.charts.category')} />
                    <div className="h-[16rem]">
                      {categoryRows.length > 0 ? (
                        <CategoryDoughnutChart
                          data={{
                            labels: categoryRows.map((row) => row.name),
                            values: categoryRows.map((row) => row.total),
                            colors: categoryRows.map((row) => row.color),
                          }}
                        />
                      ) : (
                        <EmptyState title={t('reports.charts.categoryEmpty')} compact icon={<PieChart size={18} />} />
                      )}
                    </div>
                  </div>
                </SurfaceCard>
                <SurfaceCard>
                  <div className="grid gap-3">
                    <SectionHeading title={t('reports.charts.trend')} />
                    <div className="h-[16rem]">
                      <TransactionBarChart
                        data={{
                          labels: trendLabels,
                          income: trendIncome,
                          expense: trendExpense,
                        }}
                      />
                    </div>
                  </div>
                </SurfaceCard>
                <section className="grid grid-cols-2 gap-2.5">
                  <InsightCard
                    icon={<TrendingUp size={18} />}
                    label={t('reports.insights.topCategory')}
                    title={topCategory ? topCategory.name : t('reports.insights.noCategory')}
                    meta={topCategory ? formatCurrency(topCategory.total) : '-'}
                  />
                  <InsightCard
                    icon={<Wallet size={18} />}
                    label={t('reports.insights.activeWallet')}
                    title={mostActiveWallet ? mostActiveWallet.name : t('reports.insights.noWallet')}
                    meta={mostActiveWallet ? `${mostActiveWallet.count}` : '-'}
                  />
                  <InsightCard
                    icon={<BarChart3 size={18} />}
                    label={t('reports.insights.averageDaily')}
                    title={formatCurrency(averageDailyExpense)}
                    meta={`${visibleExpenseTransactions.length} ${t('transactions.summary.count').toLowerCase()}`}
                  />
                </section>
              </section>
            </div>
          </details>

          <section className="hidden gap-4 sm:grid xl:grid-cols-2">
            <SurfaceCard>
              <div className="grid gap-4">
                <SectionHeading title={t('reports.charts.category')} />

                <div className="h-[18rem]">
                  {categoryRows.length > 0 ? (
                    <CategoryDoughnutChart
                      data={{
                        labels: categoryRows.map((row) => row.name),
                        values: categoryRows.map((row) => row.total),
                        colors: categoryRows.map((row) => row.color),
                      }}
                    />
                  ) : (
                    <EmptyState title={t('reports.charts.categoryEmpty')} compact icon={<PieChart size={18} />} />
                  )}
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard>
              <div className="grid gap-4">
                <SectionHeading title={t('reports.charts.trend')} />

                <div className="h-[18rem]">
                  <TransactionBarChart
                    data={{
                      labels: trendLabels,
                      income: trendIncome,
                      expense: trendExpense,
                    }}
                  />
                </div>
              </div>
            </SurfaceCard>
          </section>

          <section className="hidden gap-3 md:grid-cols-3 sm:grid">
            <InsightCard
              icon={<TrendingUp size={18} />}
              label={t('reports.insights.topCategory')}
              title={topCategory ? topCategory.name : t('reports.insights.noCategory')}
              meta={topCategory ? formatCurrency(topCategory.total) : '-'}
            />
            <InsightCard
              icon={<Wallet size={18} />}
              label={t('reports.insights.activeWallet')}
              title={mostActiveWallet ? mostActiveWallet.name : t('reports.insights.noWallet')}
              meta={mostActiveWallet ? `${mostActiveWallet.count}` : '-'}
            />
            <InsightCard
              icon={<BarChart3 size={18} />}
              label={t('reports.insights.averageDaily')}
              title={formatCurrency(averageDailyExpense)}
              meta={`${visibleExpenseTransactions.length} ${t('transactions.summary.count').toLowerCase()}`}
            />
          </section>

          <SurfaceCard>
            <div className="grid gap-3">
              <SectionHeading title={t('reports.keyword.title')} />

              <label
                htmlFor="reports-keyword"
                className="flex min-h-[2.95rem] items-center gap-3 rounded-2xl border border-border-subtle bg-surface-2/70 px-3.5 transition focus-within:border-accent focus-within:ring-4 focus-within:ring-accent-soft/70 sm:min-h-[3.2rem] sm:px-4"
              >
                <Search size={18} className="text-text-3" />
                <Input
                  id="reports-keyword"
                  type="search"
                  value={urlState.keyword}
                  onChange={(event) =>
                    replaceReportsState({
                      ...urlState,
                      keyword: event.target.value,
                    })
                  }
                  placeholder={t('reports.keyword.placeholder')}
                  className="min-h-0 border-0 bg-transparent px-0 py-0 shadow-none ring-0 focus:ring-0"
                />
              </label>

              {!deferredKeyword ? (
                <EmptyState title={t('reports.keyword.empty')} compact icon={<Search size={18} />} />
              ) : keywordMatches.length === 0 ? (
                <EmptyState
                  title={t('reports.keyword.noResults')}
                  compact
                  icon={<Search size={18} />}
                />
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label={t('reports.keyword.currentWindow')} value={formatCurrency(keywordCurrentTotal)} />
                    <MetricCard label={t('reports.keyword.last30Days')} value={formatCurrency(keywordLast30Total)} />
                    <MetricCard label={t('reports.keyword.count')} value={keywordVisibleMatches.length} />
                    <MetricCard label={t('reports.keyword.average')} value={formatCurrency(keywordAverage)} />
                  </div>

                  <div className="grid gap-1">
                    <span className="text-sm text-text-3">{t('reports.keyword.latest')}</span>
                    <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                      {keywordLatest
                        ? `${keywordLatest.title || keywordLatest.note || t('common.noNote')} - ${formatDate(
                            getTransactionDateValue(keywordLatest)
                          )}`
                        : t('reports.keyword.noLatest')}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </SurfaceCard>
        </>
      )}
    </PageShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="animate-fade-in">
          <PageHeader>
            <PageHeading title="Reports" />
          </PageHeader>
          <Card>
            <EmptyState title="Loading..." compact />
          </Card>
        </PageShell>
      }
    >
      <ReportsPageContent />
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
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:overflow-visible md:pb-0">{children}</div>
    </div>
  );
}

function FilterField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
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
    </div>
  );
}

function InsightCard({
  icon,
  label,
  title,
  meta,
}: {
  icon: React.ReactNode;
  label: string;
  title: string;
  meta: string;
}) {
  return (
    <Card className="grid gap-2.5 border-border-subtle bg-surface-1 p-3.5 shadow-none">
      <div className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] bg-accent-soft text-accent-strong">
        {icon}
      </div>
      <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">{label}</span>
      <strong className="text-base font-semibold tracking-[-0.03em] text-text-1">{title}</strong>
      <span className="text-sm text-text-3">{meta}</span>
    </Card>
  );
}
