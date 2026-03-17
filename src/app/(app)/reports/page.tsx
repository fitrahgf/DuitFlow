"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  differenceInCalendarDays,
  endOfDay,
  isSameMonth,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import { Suspense, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  PieChart,
  RotateCcw,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { CategoryDoughnutChart, TransactionBarChart } from "@/components/Chart";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import {
  FilterField,
  FilterFieldGrid,
  FilterGroup,
  FilterSearchField,
  FilterSelect,
  FilterToolbar,
} from "@/components/filters/FilterPatterns";
import { useLanguage } from "@/components/LanguageProvider";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/events";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchReportsOverview,
  type ReportTransaction,
} from "@/lib/queries/reports";
import { fetchCategories } from "@/lib/queries/reference";
import {
  parseReportsUrlState,
  serializeReportsUrlState,
  type ReportsUrlState,
} from "@/lib/url-state";
import { cn } from "@/lib/utils";

type ReportPeriodFilter = "all" | "month" | "30d" | "7d" | "custom";

interface ReportFilters {
  period: ReportPeriodFilter;
  walletId: string;
  categoryId: string;
  customFrom: string;
  customTo: string;
}

const defaultReportFilters: ReportFilters = {
  period: "month",
  walletId: "",
  categoryId: "",
  customFrom: "",
  customTo: "",
};

function getTransactionDateValue(transaction: ReportTransaction) {
  return transaction.transaction_date || transaction.date;
}

function getTransactionDate(transaction: ReportTransaction) {
  return parseISO(getTransactionDateValue(transaction));
}

function getKeywordSearchText(transaction: ReportTransaction) {
  return [
    transaction.title,
    transaction.note,
    transaction.categories?.name,
    transaction.wallets?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesStaticFilters(
  transaction: ReportTransaction,
  filters: ReportFilters,
) {
  if (filters.walletId && transaction.wallet_id !== filters.walletId) {
    return false;
  }

  if (filters.categoryId && transaction.category_id !== filters.categoryId) {
    return false;
  }

  return true;
}

function matchesPeriod(transaction: ReportTransaction, filters: ReportFilters) {
  if (filters.period === "all") {
    return true;
  }

  const transactionDate = getTransactionDate(transaction);
  const today = new Date();

  if (filters.period === "month") {
    return isSameMonth(transactionDate, today);
  }

  if (filters.period === "30d") {
    return transactionDate >= startOfDay(subDays(today, 29));
  }

  if (filters.period === "7d") {
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

function getPeriodLabel(
  period: ReportPeriodFilter,
  t: (key: string) => string,
) {
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
    queryKey: queryKeys.categories.list("all"),
    queryFn: () => fetchCategories(),
  });

  useEffect(() => {
    const handleTransactionsChanged = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reports.overview,
      });
    };

    window.addEventListener(
      TRANSACTIONS_CHANGED_EVENT,
      handleTransactionsChanged,
    );
    return () =>
      window.removeEventListener(
        TRANSACTIONS_CHANGED_EVENT,
        handleTransactionsChanged,
      );
  }, [queryClient]);

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const transactions = reportsQuery.data?.transactions ?? [];
  const wallets = reportsQuery.data?.wallets ?? [];
  const categories = categoriesQuery.data ?? [];
  const analyticsTransactions = transactions.filter(
    (transaction) => transaction.source !== "system_transfer",
  );
  const scopedTransactions = analyticsTransactions.filter((transaction) =>
    matchesStaticFilters(transaction, filters),
  );
  const visibleTransactions = scopedTransactions.filter((transaction) =>
    matchesPeriod(transaction, filters),
  );
  const visibleIncomeTransactions = visibleTransactions.filter(
    (transaction) => transaction.type === "income",
  );
  const visibleExpenseTransactions = visibleTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  const totalIncome = visibleIncomeTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const totalExpense = visibleExpenseTransactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const netFlow = totalIncome - totalExpense;
  const totalBalance = wallets
    .filter((wallet) => wallet.is_active && !wallet.is_archived)
    .reduce((sum, wallet) => sum + wallet.balance, 0);

  const categoryTotalsMap = new Map<string, { total: number; color: string }>();
  visibleExpenseTransactions.forEach((transaction) => {
    const categoryName =
      transaction.categories?.name || t("common.uncategorized");
    const categoryColor = transaction.categories?.color || "#94a3b8";
    const current = categoryTotalsMap.get(categoryName) ?? {
      total: 0,
      color: categoryColor,
    };
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
    const label = monthDate.toLocaleDateString(
      language === "id" ? "id-ID" : "en-US",
      {
        month: "short",
      },
    );

    const monthIncome = scopedTransactions
      .filter((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        return (
          transaction.type === "income" &&
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month
        );
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const monthExpense = scopedTransactions
      .filter((transaction) => {
        const transactionDate = getTransactionDate(transaction);
        return (
          transaction.type === "expense" &&
          transactionDate.getFullYear() === year &&
          transactionDate.getMonth() === month
        );
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
      name: transaction.wallets?.name || t("transactions.unknownWallet"),
      count: 0,
    };
    current.count += 1;
    walletActivityMap.set(transaction.wallet_id, current);
  });

  const mostActiveWallet =
    [...walletActivityMap.values()].sort(
      (left, right) => right.count - left.count,
    )[0] ?? null;

  let windowDayCount = 0;
  if (filters.period === "7d") {
    windowDayCount = 7;
  } else if (filters.period === "30d") {
    windowDayCount = 30;
  } else if (filters.period === "month") {
    const start = startOfDay(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    );
    windowDayCount = differenceInCalendarDays(new Date(), start) + 1;
  } else if (
    filters.period === "custom" &&
    filters.customFrom &&
    filters.customTo
  ) {
    windowDayCount =
      differenceInCalendarDays(
        parseISO(filters.customTo),
        parseISO(filters.customFrom),
      ) + 1;
  } else if (visibleTransactions.length > 0) {
    const dates = visibleTransactions.map((transaction) =>
      getTransactionDate(transaction),
    );
    const sortedDates = [...dates].sort(
      (left, right) => left.getTime() - right.getTime(),
    );
    windowDayCount =
      differenceInCalendarDays(
        sortedDates[sortedDates.length - 1],
        sortedDates[0],
      ) + 1;
  }

  const averageDailyExpense =
    windowDayCount > 0 ? Math.round(totalExpense / windowDayCount) : 0;

  const keywordMatches = deferredKeyword
    ? scopedTransactions.filter(
        (transaction) =>
          transaction.type === "expense" &&
          getKeywordSearchText(transaction).includes(deferredKeyword),
      )
    : [];
  const keywordVisibleMatches = keywordMatches.filter((transaction) =>
    matchesPeriod(transaction, filters),
  );
  const last30Boundary = startOfDay(subDays(new Date(), 29));
  const keywordLast30Total = keywordMatches
    .filter((transaction) => getTransactionDate(transaction) >= last30Boundary)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const keywordCurrentTotal = keywordVisibleMatches.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );
  const keywordAverage =
    keywordVisibleMatches.length > 0
      ? Math.round(keywordCurrentTotal / keywordVisibleMatches.length)
      : 0;
  const keywordLatest = keywordVisibleMatches[0] ?? keywordMatches[0] ?? null;

  const filterGridClassName =
    filters.period === "custom"
      ? "grid gap-2.5 md:grid-cols-2 xl:grid-cols-4"
      : "grid gap-2.5 md:grid-cols-2 xl:grid-cols-2";
  const replaceReportsState = (nextState: ReportsUrlState) => {
    const nextQueryString = serializeReportsUrlState(nextState);
    const currentQueryString = searchParams.toString();

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(
      nextQueryString ? `${pathname}?${nextQueryString}` : pathname,
      {
        scroll: false,
      },
    );
  };

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t("reports.title")} />
        <PageHeaderActions>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="max-sm:min-w-max"
            onClick={() =>
              replaceReportsState({
                period: defaultReportFilters.period,
                wallet: "",
                category: "",
                from: "",
                to: "",
                keyword: "",
              })
            }
          >
            <RotateCcw size={16} />
            {t("reports.reset")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard
        padding="compact"
        className="sticky top-[var(--shell-sticky-offset)] z-20 sm:static"
      >
        <FilterToolbar className="gap-2.5">
          <FilterGroup label={t("reports.filters.period")}>
            {(["month", "30d", "7d", "all", "custom"] as const).map(
              (period) => (
                <Button
                  key={period}
                  type="button"
                  size="sm"
                  variant={filters.period === period ? "primary" : "ghost"}
                  className={cn(
                    "px-2.5",
                    filters.period !== period &&
                      "border-transparent text-text-2 hover:bg-surface-2/88 hover:text-text-1",
                  )}
                  onClick={() =>
                    replaceReportsState({
                      ...urlState,
                      period,
                      from: period === "custom" ? urlState.from : "",
                      to: period === "custom" ? urlState.to : "",
                    })
                  }
                >
                  {getPeriodLabel(period, t)}
                </Button>
              ),
            )}
          </FilterGroup>

          <FilterFieldGrid className={cn("gap-3", filterGridClassName)}>
            <FilterField
              label={t("reports.filters.wallet")}
              htmlFor="reports-wallet"
            >
              <FilterSelect
                id="reports-wallet"
                value={filters.walletId}
                onChange={(event) =>
                  replaceReportsState({
                    ...urlState,
                    wallet: event.target.value,
                  })
                }
              >
                <option value="">{t("reports.filters.allWallets")}</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterField>

            <FilterField
              label={t("reports.filters.category")}
              htmlFor="reports-category"
            >
              <FilterSelect
                id="reports-category"
                value={filters.categoryId}
                onChange={(event) =>
                  replaceReportsState({
                    ...urlState,
                    category: event.target.value,
                  })
                }
              >
                <option value="">{t("reports.filters.allCategories")}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </FilterSelect>
            </FilterField>

            {filters.period === "custom" ? (
              <>
                <FilterField
                  label={t("reports.filters.fromDate")}
                  htmlFor="reports-custom-from"
                >
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
                <FilterField
                  label={t("reports.filters.toDate")}
                  htmlFor="reports-custom-to"
                >
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
          </FilterFieldGrid>
        </FilterToolbar>
      </SurfaceCard>

      {reportsQuery.isLoading ? (
        <SurfaceCard padding="compact">
          <EmptyState title={t("common.loading")} compact />
        </SurfaceCard>
      ) : reportsQuery.isError ? (
        <SurfaceCard padding="compact">
          <EmptyState title={t("reports.loadError")} compact />
        </SurfaceCard>
      ) : (
        <>
          <section className="grid gap-2.5 xl:grid-cols-[minmax(0,1.22fr)_repeat(3,minmax(13.5rem,0.92fr))] 2xl:grid-cols-[minmax(0,1.28fr)_repeat(3,minmax(14rem,0.9fr))]">
            <MetricCard
              label={t("reports.summary.net")}
              value={
                <span className="text-[1.24rem] font-semibold tracking-[-0.055em] sm:text-[1.34rem]">
                  {formatCurrency(netFlow)}
                </span>
              }
              meta={getPeriodLabel(filters.period, t)}
              tone="accent"
              className="min-h-[4.95rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("reports.summary.income")}
              value={formatCurrency(totalIncome)}
              tone="success"
              className="min-h-[4.35rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("reports.summary.expense")}
              value={formatCurrency(totalExpense)}
              tone="danger"
              className="min-h-[4.35rem] p-[var(--space-panel-tight)]"
            />
            <MetricCard
              label={t("reports.summary.balance")}
              value={formatCurrency(totalBalance)}
              className="min-h-[4.35rem] p-[var(--space-panel-tight)]"
            />
          </section>

          <details className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 sm:hidden">
            <summary className="flex list-none items-center justify-between gap-3 px-3 py-2.5">
              <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                {language === "id" ? "Charts & insight" : "Charts & insights"}
              </strong>
              <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
                v
              </span>
            </summary>
            <div className="grid gap-2.5 border-t border-border-subtle px-3 py-2.5">
              <section className="grid gap-2.5">
                <SurfaceCard padding="compact">
                  <div className="grid gap-2.5">
                    <SectionHeading title={t("reports.charts.trend")} />
                    <div className="h-[14rem]">
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
                <SurfaceCard padding="compact">
                  <div className="grid gap-2.5">
                    <SectionHeading title={t("reports.charts.category")} />
                    <div className="h-[14.5rem]">
                      {categoryRows.length > 0 ? (
                        <CategoryDoughnutChart
                          data={{
                            labels: categoryRows.map((row) => row.name),
                            values: categoryRows.map((row) => row.total),
                            colors: categoryRows.map((row) => row.color),
                          }}
                        />
                      ) : (
                        <EmptyState
                          title={t("reports.charts.categoryEmpty")}
                          compact
                          icon={<PieChart size={18} />}
                        />
                      )}
                    </div>
                  </div>
                </SurfaceCard>
                <section className="grid grid-cols-2 gap-2.5">
                  <InsightCard
                    icon={<TrendingUp size={18} />}
                    label={t("reports.insights.topCategory")}
                    title={
                      topCategory
                        ? topCategory.name
                        : t("reports.insights.noCategory")
                    }
                    meta={topCategory ? formatCurrency(topCategory.total) : "-"}
                  />
                  <InsightCard
                    icon={<Wallet size={18} />}
                    label={t("reports.insights.activeWallet")}
                    title={
                      mostActiveWallet
                        ? mostActiveWallet.name
                        : t("reports.insights.noWallet")
                    }
                    meta={mostActiveWallet ? `${mostActiveWallet.count}` : "-"}
                  />
                  <InsightCard
                    icon={<BarChart3 size={18} />}
                    label={t("reports.insights.averageDaily")}
                    title={formatCurrency(averageDailyExpense)}
                    meta={`${visibleExpenseTransactions.length} ${t("transactions.summary.count").toLowerCase()}`}
                  />
                </section>
              </section>
            </div>
          </details>

          <section className="hidden gap-2.5 sm:grid xl:grid-cols-[minmax(0,1.24fr)_minmax(21rem,0.76fr)] 2xl:grid-cols-[minmax(0,1.32fr)_minmax(22.5rem,0.68fr)]">
            <SurfaceCard padding="compact">
              <div className="grid gap-2.5">
                <SectionHeading title={t("reports.charts.trend")} />

                <div className="h-[15.5rem]">
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

            <SurfaceCard padding="compact">
              <div className="grid gap-2.5">
                <SectionHeading title={t("reports.charts.category")} />

                <div className="h-[15.5rem]">
                  {categoryRows.length > 0 ? (
                    <CategoryDoughnutChart
                      data={{
                        labels: categoryRows.map((row) => row.name),
                        values: categoryRows.map((row) => row.total),
                        colors: categoryRows.map((row) => row.color),
                      }}
                    />
                  ) : (
                    <EmptyState
                      title={t("reports.charts.categoryEmpty")}
                      compact
                      icon={<PieChart size={18} />}
                    />
                  )}
                </div>
              </div>
            </SurfaceCard>
          </section>

          <section className="hidden gap-2.5 md:grid-cols-3 sm:grid">
            <InsightCard
              icon={<TrendingUp size={18} />}
              label={t("reports.insights.topCategory")}
              title={
                topCategory
                  ? topCategory.name
                  : t("reports.insights.noCategory")
              }
              meta={topCategory ? formatCurrency(topCategory.total) : "-"}
            />
            <InsightCard
              icon={<Wallet size={18} />}
              label={t("reports.insights.activeWallet")}
              title={
                mostActiveWallet
                  ? mostActiveWallet.name
                  : t("reports.insights.noWallet")
              }
              meta={mostActiveWallet ? `${mostActiveWallet.count}` : "-"}
            />
            <InsightCard
              icon={<BarChart3 size={18} />}
              label={t("reports.insights.averageDaily")}
              title={formatCurrency(averageDailyExpense)}
              meta={`${visibleExpenseTransactions.length} ${t("transactions.summary.count").toLowerCase()}`}
            />
          </section>

          <SurfaceCard padding="compact">
            <div className="grid gap-2.5">
              <SectionHeading title={t("reports.keyword.title")} />

              <FilterSearchField
                id="reports-keyword"
                value={urlState.keyword}
                onChange={(event) =>
                  replaceReportsState({
                    ...urlState,
                    keyword: event.target.value,
                  })
                }
                placeholder={t("reports.keyword.placeholder")}
                className="bg-surface-1"
                inputClassName="text-[0.82rem]"
              />

              {!deferredKeyword ? (
                <EmptyState
                  title={t("reports.keyword.empty")}
                  compact
                  icon={<Search size={18} />}
                />
              ) : keywordMatches.length === 0 ? (
                <EmptyState
                  title={t("reports.keyword.noResults")}
                  compact
                  icon={<Search size={18} />}
                />
              ) : (
                <>
                  <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      label={t("reports.keyword.currentWindow")}
                      value={formatCurrency(keywordCurrentTotal)}
                      className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
                    />
                    <MetricCard
                      label={t("reports.keyword.last30Days")}
                      value={formatCurrency(keywordLast30Total)}
                      className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
                    />
                    <MetricCard
                      label={t("reports.keyword.count")}
                      value={keywordVisibleMatches.length}
                      className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
                    />
                    <MetricCard
                      label={t("reports.keyword.average")}
                      value={formatCurrency(keywordAverage)}
                      className="min-h-[4.25rem] p-[var(--space-panel-tight)]"
                    />
                  </div>

                  <div className="grid gap-1">
                    <span className="text-[0.78rem] text-text-3">
                      {t("reports.keyword.latest")}
                    </span>
                    <strong className="text-[0.86rem] font-semibold tracking-[-0.025em] text-text-1">
                      {keywordLatest
                        ? `${keywordLatest.title || keywordLatest.note || t("common.noNote")} - ${formatDate(
                            getTransactionDateValue(keywordLatest),
                          )}`
                        : t("reports.keyword.noLatest")}
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
    <Card className="grid gap-2 border-border-subtle bg-surface-1 p-3 shadow-none">
      <div className="flex items-start gap-2.5">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.02rem)] bg-accent-soft text-accent-strong">
          {icon}
        </div>
        <div className="grid min-w-0 gap-0.5">
          <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">
            {label}
          </span>
          <strong className="truncate text-[0.92rem] font-semibold tracking-[-0.03em] text-text-1">
            {title}
          </strong>
        </div>
      </div>
      <span className="text-[0.72rem] leading-4 text-text-3">{meta}</span>
    </Card>
  );
}
