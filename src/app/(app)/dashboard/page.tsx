'use client';

import { differenceInCalendarDays, parseISO } from 'date-fns';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Clock3,
  PieChart,
  ReceiptText,
  Target,
  Wallet,
} from 'lucide-react';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import TransactionForm, { type TransactionFormPrefill } from '@/components/TransactionForm';
import QuickAddComposer from '@/components/QuickAddComposer';
import { CategoryDoughnutChart, TransactionBarChart } from '@/components/Chart';
import { useLanguage } from '@/components/LanguageProvider';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  MetricCard,
  PageHeader,
  PageHeading,
  PageShell,
  ProgressMeter,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getBudgetTone, sumSpentForCategory, summarizeBudgetUsage, type BudgetTone } from '@/lib/budgetMath';
import { getCategoryIcon } from '@/lib/icons';
import { queryKeys } from '@/lib/queries/keys';
import {
  fetchDashboardOverview,
  type DashboardBudgetRecord,
  type DashboardWalletSummary,
  type DashboardWishlistItem,
} from '@/lib/queries/dashboard';
import { buildTransactionDisplayItems, getTransactionDisplayDate, type TransactionDisplayItem } from '@/lib/transactionFeed';
import { cn } from '@/lib/utils';

function formatShortDate(value: string, language: 'en' | 'id') {
  return new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function getWalletShare(wallet: DashboardWalletSummary, totalBalance: number) {
  if (totalBalance <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((wallet.balance / totalBalance) * 100));
}

function getWishlistCountdownLabel(item: DashboardWishlistItem, language: 'en' | 'id') {
  const difference = differenceInCalendarDays(parseISO(item.review_date), new Date());

  if (difference <= 0) {
    return language === 'id' ? 'Siap ditinjau' : 'Ready to review';
  }

  if (difference === 1) {
    return language === 'id' ? '1 hari lagi' : '1 day left';
  }

  return language === 'id' ? `${difference} hari lagi` : `${difference} days left`;
}

const toneToProgressTone: Record<BudgetTone, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  danger: 'danger',
};

const toneToBadgeVariant: Record<BudgetTone, 'success' | 'warning' | 'danger'> = {
  ok: 'success',
  warning: 'warning',
  danger: 'danger',
};

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const [quickFormOpen, setQuickFormOpen] = useState(false);
  const [quickFormPrefill, setQuickFormPrefill] = useState<TransactionFormPrefill | null>(null);
  const [insightView, setInsightView] = useState<'activity' | 'breakdown'>('activity');

  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: fetchDashboardOverview,
  });

  useEffect(() => {
    const handleTransactionsChanged = () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview });
    };

    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
  }, [queryClient]);

  const data = dashboardQuery.data;
  const transactions = data?.transactions ?? [];
  const wallets = data?.wallets ?? [];
  const budgets = data?.budgets ?? [];
  const wishlistItems = data?.wishlist ?? [];
  const loading = dashboardQuery.isLoading;

  const displayTransactions = buildTransactionDisplayItems(transactions);
  const analyticsTransactions = transactions.filter((item) => item.source !== 'system_transfer');
  const monthlyExpenses = analyticsTransactions.filter((item) => item.type === 'expense');
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const totalIncome = analyticsTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = monthlyExpenses.reduce((sum, item) => sum + item.amount, 0);
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

  const readyWishlistItems = wishlistItems.filter((item) => differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0);
  const wishlistHighlights = (readyWishlistItems.length > 0 ? readyWishlistItems : wishlistItems).slice(0, 2);
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
  ] as const;
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
        currentDate.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
          weekday: 'short',
        })
      );
      income.push(
        analyticsTransactions
          .filter((item) => (item.transaction_date || item.date) === dateString && item.type === 'income')
          .reduce((sum, item) => sum + item.amount, 0)
      );
      expense.push(
        analyticsTransactions
          .filter((item) => (item.transaction_date || item.date) === dateString && item.type === 'expense')
          .reduce((sum, item) => sum + item.amount, 0)
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

  const budgetPanelContent =
    overallBudgetLimit > 0 ? (
      <div className="grid gap-3.5">
        <div className="grid gap-3 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/55 p-3.5 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
                {formatCurrency(overallBudgetSpent)}
              </strong>
              <span className="text-sm text-text-3">{t('dashboard.budgetSpent')}</span>
            </div>
            <Badge variant={toneToBadgeVariant[budgetTone]}>{budgetStatusLabel}</Badge>
          </div>

          <ProgressMeter
            value={overallBudgetRatio}
            tone={toneToProgressTone[budgetTone]}
            className="h-2 bg-surface-1"
            ariaLabel={t('dashboard.budgetTitle')}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-text-3">
            <span>
              {t('dashboard.budgetRemaining')}: {formatCurrency(overallBudgetRemaining)}
            </span>
            <span>
              {t('dashboard.budgetLimit')}: {formatCurrency(overallBudgetLimit)}
            </span>
          </div>
        </div>

        {categoryBudgetRows.length > 0 ? (
          <div className="grid gap-2">
            {categoryBudgetRows.map((budget) => (
              <BudgetUsageRow key={budget.id} budget={budget} />
            ))}
          </div>
        ) : null}
      </div>
    ) : (
      <EmptyState title={t('dashboard.noBudget')} compact icon={<Target size={18} />} />
    );

  const wishlistPanelContent =
    wishlistItems.length === 0 ? (
      <EmptyState title={t('dashboard.noWishlistItems')} compact icon={<Clock3 size={18} />} />
    ) : (
      <div className="overflow-hidden rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/45">
        {wishlistHighlights.map((item, index) => (
          <WishlistReviewRow
            key={item.id}
            item={item}
            language={language}
            formatCurrency={formatCurrency}
            className={index > 0 ? 'border-t border-border-subtle' : undefined}
          />
        ))}
      </div>
    );

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading
          eyebrow="Workspace"
          title={t('dashboard.title')}
        />
        <Button asChild variant="secondary" className="hidden sm:inline-flex">
          <Link href="/wallets">
            <Wallet size={16} />
            {t('nav.wallets')}
          </Link>
        </Button>
      </PageHeader>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.46fr)_minmax(19.75rem,0.94fr)]">
        <SurfaceCard className="order-2 overflow-hidden bg-[var(--gradient-shell-panel)] xl:order-1">
          <div className="grid gap-3 sm:gap-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-1.5">
                <span className="text-[0.72rem] font-bold uppercase tracking-[0.18em] text-text-3">
                  {t('dashboard.totalBalance')}
                </span>
                <strong className="text-[clamp(2.4rem,2rem+2vw,4rem)] font-semibold leading-none tracking-[-0.08em] text-text-1">
                  {loading ? '...' : formatCurrency(totalBalance)}
                </strong>
              </div>
              <Badge variant="accent" className="self-start">
                {data?.monthKey ?? '---- --'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <MetricCard
                label={t('dashboard.monthlyIncome')}
                value={loading ? '...' : formatCurrency(totalIncome)}
                tone="success"
              />
              <MetricCard
                label={t('dashboard.monthlyExpense')}
                value={loading ? '...' : formatCurrency(totalExpense)}
                tone="danger"
              />
              <MetricCard
                label={t('dashboard.monthlyTransfers')}
                value={loading ? '...' : formatCurrency(totalTransfers)}
                tone="accent"
                className="col-span-2 sm:col-span-1"
              />
            </div>
          </div>
        </SurfaceCard>

        <div className="order-1 grid gap-3 xl:order-2">
          <SurfaceCard>
            <div className="grid gap-3">
              <SectionHeading
                title={t('nav.quickTransaction')}
                actions={
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/transactions">{t('dashboard.quickAdd.openForm')}</Link>
                  </Button>
                }
              />

              <QuickAddComposer
                onReview={(draft) => {
                  setQuickFormPrefill(draft);
                  setQuickFormOpen(true);
                }}
              />
            </div>
          </SurfaceCard>

          <SurfaceCard className="hidden sm:grid">
            <div className="grid gap-3">
              <SectionHeading
                title={language === 'id' ? 'Fokus' : 'Focus'}
              />

              <div className="grid gap-2">
                <DashboardFocusBlock
                  title={t('dashboard.walletSnapshotTitle')}
                  href="/wallets"
                  actionLabel={t('dashboard.viewAll')}
                >
                  {wallets.length > 0 ? (
                    <div className="grid gap-1.5">
                      {topWallets.map((wallet) => (
                        <DesktopWalletCompactRow
                          key={wallet.id}
                          wallet={wallet}
                          totalBalance={totalBalance}
                          formatCurrency={formatCurrency}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title={language === 'id' ? 'Belum ada dompet aktif.' : 'No active wallets yet.'}
                      compact
                      icon={<Wallet size={18} />}
                    />
                  )}
                </DashboardFocusBlock>

                <DashboardFocusBlock
                  title={t('dashboard.budgetTitle')}
                  href="/budgets"
                  actionLabel={t('dashboard.viewAll')}
                >
                  {overallBudgetLimit > 0 ? (
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                          {formatCurrency(overallBudgetSpent)}
                        </strong>
                        <Badge variant={toneToBadgeVariant[budgetTone]}>{budgetStatusLabel}</Badge>
                      </div>
                      <ProgressMeter
                        value={overallBudgetRatio}
                        tone={toneToProgressTone[budgetTone]}
                        className="h-1.5 bg-surface-1"
                        ariaLabel={t('dashboard.budgetTitle')}
                      />
                      <div className="flex items-center justify-between gap-2 text-xs text-text-3">
                        <span>{formatCurrency(overallBudgetLimit)}</span>
                        <span>{formatCurrency(overallBudgetRemaining)}</span>
                      </div>
                    </div>
                  ) : (
                    <CompactEmptyLine icon={<Target size={15} />} label={t('dashboard.noBudget')} />
                  )}
                </DashboardFocusBlock>

                <DashboardFocusBlock
                  title={t('dashboard.wishlistTitle')}
                  href="/wishlist"
                  actionLabel={readyWishlistItems.length > 0 ? t('dashboard.reviewNow') : t('dashboard.viewAll')}
                >
                  {primaryWishlistItem ? (
                    <div className="grid gap-1.5">
                      <strong className="truncate text-sm font-semibold tracking-[-0.03em] text-text-1">
                        {primaryWishlistItem.item_name}
                      </strong>
                      <div className="flex items-center justify-between gap-2 text-xs text-text-3">
                        <span>{getWishlistCountdownLabel(primaryWishlistItem, language)}</span>
                        <span>{formatCurrency(primaryWishlistItem.target_price ?? 0)}</span>
                      </div>
                    </div>
                  ) : (
                    <CompactEmptyLine icon={<Clock3 size={15} />} label={t('dashboard.noWishlistItems')} />
                  )}
                </DashboardFocusBlock>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </section>

      <section className="grid gap-3 sm:hidden">
        <div className="grid grid-cols-2 gap-3">
          <MobilePriorityCard
            href="/budgets"
            eyebrow={t('dashboard.budgetTitle')}
            title={overallBudgetLimit > 0 ? budgetStatusLabel : t('dashboard.noBudget')}
            value={
              overallBudgetLimit > 0
                ? `${formatCurrency(overallBudgetSpent)} / ${formatCurrency(overallBudgetLimit)}`
                : undefined
            }
            tone={overallBudgetRatio >= 1 ? 'danger' : overallBudgetRatio >= 0.8 ? 'warning' : 'accent'}
          />
          <MobilePriorityCard
            href="/wishlist"
            eyebrow={t('dashboard.wishlistTitle')}
            title={primaryWishlistItem ? primaryWishlistItem.item_name : t('dashboard.noWishlistItems')}
            value={primaryWishlistItem?.target_price ? formatCurrency(primaryWishlistItem.target_price) : undefined}
            tone={primaryWishlistItem ? 'accent' : 'default'}
          />
        </div>
        {wallets.length > 0 ? (
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">
                {t('dashboard.walletSnapshotTitle')}
              </span>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2.5">
                <Link href="/wallets">{t('dashboard.viewAll')}</Link>
              </Button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topWallets.map((wallet) => (
                <MobileWalletStripCard
                  key={wallet.id}
                  wallet={wallet}
                  totalBalance={totalBalance}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {!loading && !hasActivity ? (
        <Card className="border-dashed p-4 md:p-5">
          <div className="grid gap-4">
            <SectionHeading
              eyebrow={t('dashboard.onboarding.eyebrow')}
              title={t('dashboard.onboarding.title')}
            />

            <div className="grid gap-2.5">
              {setupSteps.map((step, index) => (
                <SetupStepRow
                  key={step.id}
                  index={index + 1}
                  title={step.title}
                  done={step.done}
                  active={nextSetupStep?.id === step.id}
                  activeLabel={t('dashboard.onboarding.next')}
                  doneLabel={t('dashboard.onboarding.done')}
                />
              ))}
            </div>

            {nextSetupStep ? (
              <Button asChild variant="primary" className="max-sm:w-full">
                <Link href={nextSetupStep.href}>{nextSetupStep.title}</Link>
              </Button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.12fr)_minmax(19.75rem,0.88fr)]">
        <SurfaceCard>
          <div className="grid gap-3">
            <SectionHeading
              title={t('dashboard.recentTransactions')}
              actions={
                <Button asChild variant="ghost" size="sm">
                  <Link href="/transactions">{t('dashboard.viewAll')}</Link>
                </Button>
              }
            />

            {loading ? (
              <EmptyState title={t('common.loading')} compact />
            ) : recentTransactions.length === 0 ? (
              <EmptyState title={t('dashboard.noTransactions')} compact icon={<ReceiptText size={18} />} />
            ) : (
              <div className="overflow-hidden rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/45">
                {recentTransactions.map((transaction, index) => (
                  <RecentActivityRow
                    key={transaction.id}
                    transaction={transaction}
                    language={language}
                    t={t}
                    className={index > 0 ? 'border-t border-border-subtle' : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard className="hidden sm:grid">
          <div className="grid gap-3">
            <SectionHeading
              title={language === 'id' ? 'Insights' : 'Insights'}
              actions={
                <div className="inline-flex rounded-full border border-border-subtle bg-surface-2 p-1">
                  <InsightToggleButton
                    active={insightView === 'activity'}
                    onClick={() => setInsightView('activity')}
                  >
                    {language === 'id' ? 'Aktivitas' : 'Activity'}
                  </InsightToggleButton>
                  <InsightToggleButton
                    active={insightView === 'breakdown'}
                    onClick={() => setInsightView('breakdown')}
                  >
                    {language === 'id' ? 'Kategori' : 'Category'}
                  </InsightToggleButton>
                </div>
              }
            />

            {insightView === 'activity' ? (
              <div className="grid gap-3">
                <div className="flex items-center gap-3 text-[0.72rem] font-medium text-text-3">
                  <ChartLegendLabel colorClassName="bg-success" label={t('dashboard.monthlyIncome')} />
                  <ChartLegendLabel colorClassName="bg-danger" label={t('dashboard.monthlyExpense')} />
                </div>
                <div className="rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/35 px-2 py-2 sm:px-3">
                  <div className="h-[16rem]">
                    <TransactionBarChart data={barData} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/35 px-2 py-2 sm:px-3">
                  <div className="h-[16rem]">
                    {hasCategoryBreakdown ? (
                      <CategoryDoughnutChart data={categoryData} />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <EmptyState title={t('dashboard.noExpenseData')} compact icon={<PieChart size={18} />} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </SurfaceCard>
      </section>

      <Dialog
        open={quickFormOpen}
        onOpenChange={(open) => {
          setQuickFormOpen(open);
          if (!open) {
            setQuickFormPrefill(null);
          }
        }}
      >
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{t('transactions.form.new')}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialValues={quickFormPrefill}
            createSource="quick_add"
            onSuccess={() => {
              setQuickFormOpen(false);
              setQuickFormPrefill(null);
            }}
            onCancel={() => {
              setQuickFormOpen(false);
              setQuickFormPrefill(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <section className="grid gap-3 sm:hidden">
        <MobileDisclosureCard
          title={t('dashboard.budgetTitle')}
          description={budgetStatusLabel}
          defaultOpen={overallBudgetRatio >= 0.8}
        >
          {budgetPanelContent}
        </MobileDisclosureCard>
        <MobileDisclosureCard
          title={t('dashboard.wishlistTitle')}
          description={primaryWishlistItem ? primaryWishlistItem.item_name : t('dashboard.noWishlistItems')}
        >
          {wishlistPanelContent}
        </MobileDisclosureCard>
        <MobileDisclosureCard title={language === 'id' ? 'Insights' : 'Insights'}>
          <div className="grid gap-3">
            <div className="inline-flex w-fit rounded-full border border-border-subtle bg-surface-2 p-1">
              <InsightToggleButton
                active={insightView === 'activity'}
                onClick={() => setInsightView('activity')}
              >
                {language === 'id' ? 'Aktivitas' : 'Activity'}
              </InsightToggleButton>
              <InsightToggleButton
                active={insightView === 'breakdown'}
                onClick={() => setInsightView('breakdown')}
              >
                {language === 'id' ? 'Kategori' : 'Category'}
              </InsightToggleButton>
            </div>

            {insightView === 'activity' ? (
              <div className="grid gap-3">
                <SectionHeading
                  title={t('dashboard.weeklyActivity')}
                  actions={
                    <div className="flex items-center gap-3 text-[0.72rem] font-medium text-text-3">
                      <ChartLegendLabel colorClassName="bg-success" label={t('dashboard.monthlyIncome')} />
                      <ChartLegendLabel colorClassName="bg-danger" label={t('dashboard.monthlyExpense')} />
                    </div>
                  }
                />
                <div className="rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/35 px-2 py-2 sm:px-3">
                  <div className="h-[15rem] sm:h-[16.25rem]">
                    <TransactionBarChart data={barData} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-3">
                <SectionHeading title={t('dashboard.expenseBreakdown')} />
                <div className="rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/35 px-2 py-2 sm:px-3">
                  <div className="h-[15rem] sm:h-[16.25rem]">
                    {hasCategoryBreakdown ? (
                      <CategoryDoughnutChart data={categoryData} />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <EmptyState title={t('dashboard.noExpenseData')} compact icon={<PieChart size={18} />} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </MobileDisclosureCard>
      </section>
    </PageShell>
  );
}

function MobilePriorityCard({
  href,
  eyebrow,
  title,
  value,
  tone = 'default',
}: {
  href: string;
  eyebrow: string;
  title: string;
  value?: string;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
}) {
  const toneClassName = {
    default: 'border-border-subtle bg-surface-1',
    accent: 'border-accent/20 bg-surface-accent/35',
    warning: 'border-warning/25 bg-warning-soft/25',
    danger: 'border-danger/25 bg-danger-soft/20',
  }[tone];

  return (
    <Link
      href={href}
      className={cn(
        'grid gap-1.5 rounded-[calc(var(--radius-card)-0.08rem)] border p-3 transition-all duration-300 hover:border-border-strong hover:bg-surface-2/65',
        toneClassName
      )}
    >
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">{eyebrow}</span>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{title}</strong>
      {value ? <span className="text-xs text-text-3">{value}</span> : null}
    </Link>
  );
}

function MobileDisclosureCard({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1"
      open={defaultOpen}
    >
      <summary className="flex list-none items-center justify-between gap-3 px-3.5 py-3">
        <div className="grid gap-0.5">
          <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{title}</strong>
          {description ? <span className="text-xs text-text-3">{description}</span> : null}
        </div>
        <span className="text-xs font-semibold text-text-3 transition-transform duration-300 group-open:rotate-180">
          v
        </span>
      </summary>
      <div className="border-t border-border-subtle px-3.5 py-3">{children}</div>
    </details>
  );
}

function ChartLegendLabel({
  colorClassName,
  label,
}: {
  colorClassName: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', colorClassName)} />
      <span>{label}</span>
    </span>
  );
}

function SetupStepRow({
  index,
  title,
  done,
  active,
  activeLabel,
  doneLabel,
}: {
  index: number;
  title: string;
  done: boolean;
  active: boolean;
  activeLabel: string;
  doneLabel: string;
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/45 px-4 py-3">
      <span
        className={cn(
          'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold',
          done ? 'bg-success-soft text-success' : active ? 'bg-accent-soft text-accent-strong' : 'bg-surface-1 text-text-3'
        )}
      >
        {done ? 'OK' : index}
      </span>
      <strong className="self-center text-sm font-semibold text-text-1">{title}</strong>
      {done ? <Badge variant="success">{doneLabel}</Badge> : active ? <Badge variant="accent">{activeLabel}</Badge> : null}
    </div>
  );
}

function DashboardFocusBlock({
  title,
  href,
  actionLabel,
  children,
}: {
  title: string;
  href: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/45 p-3">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-text-3">{title}</strong>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2.5 text-xs">
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </div>
      {children}
    </div>
  );
}

function CompactEmptyLine({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-sm text-text-3">
      <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-1 text-text-3">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function DesktopWalletCompactRow({
  wallet,
  totalBalance,
  formatCurrency,
}: {
  wallet: DashboardWalletSummary;
  totalBalance: number;
  formatCurrency: (amount: number) => string;
}) {
  const share = getWalletShare(wallet, totalBalance);

  return (
    <div className="grid gap-1.5 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: wallet.color || 'var(--accent)' }}
          />
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">{wallet.name}</strong>
        </div>
        <span className="text-[0.68rem] text-text-3">{share}%</span>
      </div>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{formatCurrency(wallet.balance)}</strong>
    </div>
  );
}

function InsightToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[2rem] items-center rounded-full px-3 text-xs font-semibold transition-all duration-300',
        active ? 'bg-surface-1 text-text-1 shadow-xs' : 'text-text-3 hover:text-text-1'
      )}
    >
      {children}
    </button>
  );
}

function MobileWalletStripCard({
  wallet,
  totalBalance,
  formatCurrency,
}: {
  wallet: DashboardWalletSummary;
  totalBalance: number;
  formatCurrency: (amount: number) => string;
}) {
  const share = getWalletShare(wallet, totalBalance);

  return (
    <Link
      href="/wallets"
      className="grid min-w-[10.75rem] gap-1.5 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-1 px-3 py-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: wallet.color || 'var(--accent)' }}
          />
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">{wallet.name}</strong>
        </div>
        <span className="text-[0.68rem] font-medium text-text-3">{share}%</span>
      </div>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{formatCurrency(wallet.balance)}</strong>
    </Link>
  );
}

function BudgetUsageRow({
  budget,
}: {
  budget: DashboardBudgetRecord & { spent: number; ratio: number };
}) {
  const { formatCurrency } = useCurrencyPreferences();
  const tone = getBudgetTone(budget.ratio);

  return (
    <div className="grid gap-2.5 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/55 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
          {budget.categories?.name || 'Category'}
        </strong>
        <span className="text-[0.72rem] font-medium text-text-3">{Math.min(Math.round(budget.ratio * 100), 999)}%</span>
      </div>
      <ProgressMeter
        value={budget.ratio}
        tone={toneToProgressTone[tone]}
        className="h-1.5 bg-surface-1"
        ariaLabel={budget.categories?.name || 'Category'}
      />
      <div className="flex items-center justify-between gap-3 text-xs text-text-3">
        <span>{formatCurrency(budget.spent)}</span>
        <span>{formatCurrency(budget.amount_limit ?? 0)}</span>
      </div>
    </div>
  );
}

function RecentActivityRow({
  transaction,
  language,
  t,
  className,
}: {
  transaction: TransactionDisplayItem;
  language: 'en' | 'id';
  t: (path: string) => string;
  className?: string;
}) {
  const { formatCurrency } = useCurrencyPreferences();

  if (transaction.kind === 'transfer') {
    const transferMeta = [transaction.fromWalletName, transaction.toWalletName].filter(Boolean).join(' -> ');
    const supportingMeta = transaction.note ? `${transferMeta} / ${transaction.note}` : transferMeta;

    return (
      <div className={cn('grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center', className)}>
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
            <ArrowLeftRight size={16} />
          </span>
          <div className="grid min-w-0 gap-1">
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
              {transaction.title}
            </strong>
            <span className="truncate text-xs text-text-3">{supportingMeta}</span>
          </div>
        </div>
        <div className="grid gap-0.5 sm:justify-items-end">
          <strong className="text-sm font-semibold tracking-[-0.03em] text-accent-strong">
            {formatCurrency(transaction.amount)}
          </strong>
          <span className="text-[0.72rem] text-text-3">
            {formatShortDate(getTransactionDisplayDate(transaction), language)}
          </span>
        </div>
      </div>
    );
  }

  const toneClassName = transaction.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';
  const supportingMeta = [
    transaction.wallets?.name || t('transactions.unknownWallet'),
    transaction.categories?.name || t('common.uncategorized'),
  ].join(' / ');

  return (
    <div className={cn('grid gap-3 px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center', className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-full', toneClassName)}>
          {getCategoryIcon(
            transaction.categories?.name,
            transaction.type,
            16,
            transaction.categories?.icon ?? undefined
          )}
        </span>
        <div className="grid min-w-0 gap-1">
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
            {transaction.title || transaction.note || t('common.noNote')}
          </strong>
          <span className="truncate text-xs text-text-3">{supportingMeta}</span>
        </div>
      </div>
      <div className="grid gap-0.5 sm:justify-items-end">
        <strong
          className={cn(
            'text-sm font-semibold tracking-[-0.03em]',
            transaction.type === 'income' ? 'text-success' : 'text-danger'
          )}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </strong>
        <span className="text-[0.72rem] text-text-3">
          {formatShortDate(getTransactionDisplayDate(transaction), language)}
        </span>
      </div>
    </div>
  );
}

function WishlistReviewRow({
  item,
  language,
  formatCurrency,
  className,
}: {
  item: DashboardWishlistItem;
  language: 'en' | 'id';
  formatCurrency: (amount: number) => string;
  className?: string;
}) {
  const ready = differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0;

  return (
    <Link
      href="/wishlist"
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-3.5 transition-all duration-300 hover:bg-surface-2/75',
        className
      )}
    >
      <div className="grid min-w-0 gap-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 rounded-full', ready ? 'bg-accent-strong' : 'bg-border-strong')} />
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">{item.item_name}</strong>
        </div>
        <span className="truncate text-xs text-text-3">{getWishlistCountdownLabel(item, language)}</span>
      </div>
      <strong className="whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-text-1">
        {item.target_price ? formatCurrency(item.target_price) : '-'}
      </strong>
    </Link>
  );
}
