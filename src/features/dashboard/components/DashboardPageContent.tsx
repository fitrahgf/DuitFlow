'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Wallet } from 'lucide-react';
import type { TransactionFormPrefill } from '@/components/TransactionForm';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import { useLanguage } from '@/components/LanguageProvider';
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DashboardMobilePanelsSection,
  DashboardOnboardingSection,
  DashboardQuickTransactionDialog,
  DashboardTopSection,
} from '@/features/dashboard/components/DashboardSections';
import { TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import {
  sumSpentForCategory,
  summarizeBudgetUsage,
} from '@/lib/budgetMath';
import { queryKeys } from '@/lib/queries/keys';
import { fetchDashboardOverview } from '@/lib/queries/dashboard';
import { buildTransactionDisplayItems } from '@/lib/transactionFeed';

export function DashboardPageContent() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const [quickFormOpen, setQuickFormOpen] = useState(false);
  const [quickFormPrefill, setQuickFormPrefill] =
    useState<TransactionFormPrefill | null>(null);
  const [insightView, setInsightView] = useState<'activity' | 'breakdown'>(
    'activity',
  );

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: fetchDashboardOverview,
  });

  useEffect(() => {
    const handleTransactionsChanged = () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.overview,
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

  const data = dashboardQuery.data;
  const transactions = data?.transactions ?? [];
  const wallets = data?.wallets ?? [];
  const budgets = data?.budgets ?? [];
  const wishlistItems = data?.wishlist ?? [];
  const loading = dashboardQuery.isLoading;

  const displayTransactions = buildTransactionDisplayItems(transactions);
  const analyticsTransactions = transactions.filter(
    (item) => item.source !== 'system_transfer',
  );
  const monthlyExpenses = analyticsTransactions.filter(
    (item) => item.type === 'expense',
  );
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalIncome = analyticsTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = monthlyExpenses.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const totalTransfers = displayTransactions
    .filter((item) => item.kind === 'transfer')
    .reduce((sum, item) => sum + item.amount, 0);
  const recentTransactions = displayTransactions.slice(0, 4);
  const hasActivity = recentTransactions.length > 0;
  const topWallets = wallets.slice(0, 3);

  const budgetSummary = summarizeBudgetUsage(budgets, monthlyExpenses);
  const categoryBudgets = budgetSummary.categoryBudgets;
  const overallBudgetLimit = budgetSummary.overallLimit;
  const overallBudgetSpent = budgetSummary.overallSpent;
  const overallBudgetRatio = budgetSummary.ratio;
  const overallBudgetRemaining = budgetSummary.remaining;
  const budgetTone = budgetSummary.tone;
  const categoryBudgetRows = categoryBudgets
    .map((budget) => {
      const spent = sumSpentForCategory(budget.category_id!, monthlyExpenses);
      const limit = budget.amount_limit ?? 0;
      const ratio = limit > 0 ? spent / limit : 0;

      return {
        ...budget,
        spent,
        ratio,
      };
    })
    .sort((left, right) => right.ratio - left.ratio)
    .slice(0, 2);

  const readyWishlistItems = wishlistItems.filter(
    (item) =>
      differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0,
  );
  const wishlistHighlights = (
    readyWishlistItems.length > 0 ? readyWishlistItems : wishlistItems
  ).slice(0, 2);
  const primaryWishlistItem = wishlistHighlights[0] ?? null;
  const budgetStatusLabel =
    overallBudgetRatio >= 1
      ? t('dashboard.budgetExceeded')
      : overallBudgetRatio >= 0.8
        ? t('dashboard.budgetWarning')
        : t('dashboard.budgetOnTrack');
  const setupSteps = [
    {
      id: 'wallet',
      title: t('wallets.addWallet'),
      done: wallets.length > 0,
      href: '/wallets',
    },
    {
      id: 'transaction',
      title: t('transactions.addTransaction'),
      done: hasActivity,
      href: '/transactions',
    },
    {
      id: 'budget',
      title: t('budgets.form.new'),
      done: overallBudgetLimit > 0,
      href: '/budgets',
    },
  ];
  const nextSetupStep = setupSteps.find((step) => !step.done) ?? null;

  const barData = (() => {
    const labels: string[] = [];
    const income: number[] = [];
    const expense: number[] = [];

    for (let index = 6; index >= 0; index -= 1) {
      const currentDate = new Date();
      currentDate.setDate(currentDate.getDate() - index);
      const dateString = currentDate.toISOString().split('T')[0];

      labels.push(
        currentDate.toLocaleDateString(
          language === 'id' ? 'id-ID' : 'en-US',
          {
            weekday: 'short',
          },
        ),
      );
      income.push(
        analyticsTransactions
          .filter(
            (item) =>
              (item.transaction_date || item.date) === dateString &&
              item.type === 'income',
          )
          .reduce((sum, item) => sum + item.amount, 0),
      );
      expense.push(
        analyticsTransactions
          .filter(
            (item) =>
              (item.transaction_date || item.date) === dateString &&
              item.type === 'expense',
          )
          .reduce((sum, item) => sum + item.amount, 0),
      );
    }

    return { labels, income, expense };
  })();

  const categoryData = (() => {
    const categoryMap: Record<string, { total: number; color: string }> = {};

    monthlyExpenses
      .filter((item) => item.categories)
      .forEach((item) => {
        const name = item.categories?.name || t('common.uncategorized');
        const color = item.categories?.color || '#94a3b8';

        if (!categoryMap[name]) {
          categoryMap[name] = { total: 0, color };
        }

        categoryMap[name].total += item.amount;
      });

    return {
      labels: Object.keys(categoryMap),
      values: Object.values(categoryMap).map((item) => item.total),
      colors: Object.values(categoryMap).map((item) => item.color),
    };
  })();
  const hasCategoryBreakdown = categoryData.labels.length > 0;

  return (
    <PageShell className="animate-fade-in gap-3 xl:gap-3.5">
      <PageHeader className="gap-2.5">
        <PageHeading
          eyebrow="Workspace"
          title={t('dashboard.title')}
          subtitle={
            language === 'id'
              ? 'Saldo, aktivitas, dan fokus bulan ini dalam satu ringkasan singkat.'
              : 'Balance, activity, and monthly focus in one compact overview.'
          }
        />
        <PageHeaderActions className="max-sm:hidden">
          <Badge variant="accent" className="hidden lg:inline-flex">
            {data?.monthKey ?? '---- --'}
          </Badge>
          <Button asChild variant="secondary" className="hidden sm:inline-flex">
            <Link href="/wallets">
              <Wallet size={16} />
              {t('nav.wallets')}
            </Link>
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <DashboardTopSection
        loading={loading}
        monthKey={data?.monthKey}
        totalBalance={totalBalance}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        totalTransfers={totalTransfers}
        recentTransactions={recentTransactions}
        wallets={wallets}
        topWallets={topWallets}
        totalWalletBalance={totalBalance}
        overallBudgetLimit={overallBudgetLimit}
        overallBudgetSpent={overallBudgetSpent}
        overallBudgetRemaining={overallBudgetRemaining}
        overallBudgetRatio={overallBudgetRatio}
        budgetTone={budgetTone}
        budgetStatusLabel={budgetStatusLabel}
        primaryWishlistItem={primaryWishlistItem}
        readyWishlistItemsCount={readyWishlistItems.length}
        language={language}
        t={t}
        formatCurrency={formatCurrency}
        insightView={insightView}
        onInsightViewChange={setInsightView}
        barData={barData}
        categoryData={categoryData}
        hasCategoryBreakdown={hasCategoryBreakdown}
        onReviewQuickAdd={(draft) => {
          setQuickFormPrefill(draft);
          setQuickFormOpen(true);
        }}
      />

      <DashboardOnboardingSection
        loading={loading}
        hasActivity={hasActivity}
        setupSteps={setupSteps}
        nextSetupStep={nextSetupStep}
        t={t}
      />

      <DashboardQuickTransactionDialog
        open={quickFormOpen}
        prefill={quickFormPrefill}
        t={t}
        onOpenChange={(open) => {
          setQuickFormOpen(open);

          if (!open) {
            setQuickFormPrefill(null);
          }
        }}
        onSuccess={() => {
          setQuickFormOpen(false);
          setQuickFormPrefill(null);
        }}
      />

      <DashboardMobilePanelsSection
        insightView={insightView}
        onInsightViewChange={setInsightView}
        overallBudgetLimit={overallBudgetLimit}
        overallBudgetSpent={overallBudgetSpent}
        overallBudgetRemaining={overallBudgetRemaining}
        overallBudgetRatio={overallBudgetRatio}
        budgetTone={budgetTone}
        budgetStatusLabel={budgetStatusLabel}
        categoryBudgetRows={categoryBudgetRows}
        wishlistItems={wishlistItems}
        wishlistHighlights={wishlistHighlights}
        primaryWishlistItem={primaryWishlistItem}
        language={language}
        t={t}
        formatCurrency={formatCurrency}
        barData={barData}
        categoryData={categoryData}
        hasCategoryBreakdown={hasCategoryBreakdown}
      />
    </PageShell>
  );
}
