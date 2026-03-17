'use client';

import type { ReactNode } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Clock3,
  PieChart,
  ReceiptText,
  Target,
  Wallet,
} from 'lucide-react';
import { CategoryDoughnutChart, TransactionBarChart } from '@/components/Chart';
import QuickAddComposer from '@/components/QuickAddComposer';
import TransactionForm, {
  type TransactionFormPrefill,
} from '@/components/TransactionForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { ModalShell } from '@/components/shared/ModalShell';
import {
  ProgressMeter,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getBudgetTone,
  type BudgetTone,
} from '@/lib/budgetMath';
import { getCategoryIcon } from '@/lib/icons';
import type {
  DashboardBudgetRecord,
  DashboardWalletSummary,
  DashboardWishlistItem,
} from '@/lib/queries/dashboard';
import {
  getTransactionDisplayDate,
  type TransactionDisplayItem,
} from '@/lib/transactionFeed';
import { cn } from '@/lib/utils';

type DashboardInsightView = 'activity' | 'breakdown';

const toneToProgressTone: Record<BudgetTone, 'success' | 'warning' | 'danger'> =
  {
    ok: 'success',
    warning: 'warning',
    danger: 'danger',
  };

const toneToBadgeVariant: Record<BudgetTone, 'success' | 'warning' | 'danger'> =
  {
    ok: 'success',
    warning: 'warning',
    danger: 'danger',
  };

function formatShortDate(value: string, language: 'en' | 'id') {
  return new Date(value).toLocaleDateString(
    language === 'id' ? 'id-ID' : 'en-US',
    {
      month: 'short',
      day: 'numeric',
    },
  );
}

function getWalletShare(wallet: DashboardWalletSummary, totalBalance: number) {
  if (totalBalance <= 0) {
    return 0;
  }

  return Math.max(0, Math.round((wallet.balance / totalBalance) * 100));
}

function getWishlistCountdownLabel(
  item: DashboardWishlistItem,
  language: 'en' | 'id',
) {
  const difference = differenceInCalendarDays(
    parseISO(item.review_date),
    new Date(),
  );

  if (difference <= 0) {
    return language === 'id' ? 'Siap ditinjau' : 'Ready to review';
  }

  if (difference === 1) {
    return language === 'id' ? '1 hari lagi' : '1 day left';
  }

  return language === 'id'
    ? `${difference} hari lagi`
    : `${difference} days left`;
}

interface DashboardTopSectionProps {
  loading: boolean;
  monthKey?: string;
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  totalTransfers: number;
  recentTransactions: TransactionDisplayItem[];
  wallets: DashboardWalletSummary[];
  topWallets: DashboardWalletSummary[];
  totalWalletBalance: number;
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  overallBudgetRatio: number;
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  readyWishlistItemsCount: number;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  insightView: DashboardInsightView;
  onInsightViewChange: (view: DashboardInsightView) => void;
  barData: {
    labels: string[];
    income: number[];
    expense: number[];
  };
  categoryData: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  hasCategoryBreakdown: boolean;
  onReviewQuickAdd: (draft: TransactionFormPrefill) => void;
}

export function DashboardTopSection({
  loading,
  monthKey,
  totalBalance,
  totalIncome,
  totalExpense,
  totalTransfers,
  recentTransactions,
  wallets,
  topWallets,
  totalWalletBalance,
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  overallBudgetRatio,
  budgetTone,
  budgetStatusLabel,
  primaryWishlistItem,
  readyWishlistItemsCount,
  language,
  t,
  formatCurrency,
  insightView,
  onInsightViewChange,
  barData,
  categoryData,
  hasCategoryBreakdown,
  onReviewQuickAdd,
}: DashboardTopSectionProps) {
  const monthlyNet = totalIncome - totalExpense;
  const netFlowLabel =
    language === 'id' ? 'Arus bersih bulan ini' : 'Net flow this month';
  const quickInputLabel =
    language === 'id' ? 'Catat cepat' : 'Quick capture';
  const activeWalletsLabel =
    language === 'id'
      ? `${wallets.length} dompet aktif`
      : `${wallets.length} active wallets`;
  const plannerLabel =
    language === 'id' ? 'Fokus bulan ini' : 'Monthly focus';
  const walletSnapshotTitle =
    language === 'id' ? 'Distribusi dompet utama' : 'Top wallet distribution';

  return (
    <>
      <section className="hidden gap-3 sm:grid">
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.42fr)_minmax(22rem,0.84fr)] xl:items-start 2xl:grid-cols-[minmax(0,1.5fr)_minmax(24rem,0.74fr)]">
          <SurfaceCard className="overflow-hidden border-border-strong/50">
            <div className="grid gap-3.5">
              <div className="grid gap-2">
                <span className="text-[0.74rem] font-medium tracking-[0.08em] text-text-2">
                  {t('dashboard.totalBalance')}
                </span>
                <strong className="text-[clamp(2.7rem,2.38rem+1.6vw,4.1rem)] font-semibold leading-none tracking-[-0.088em] text-text-1">
                  {loading ? '...' : formatCurrency(totalBalance)}
                </strong>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.84rem] text-text-2">
                  <span>{netFlowLabel}</span>
                  <strong
                    className={cn(
                      'text-[0.94rem] font-semibold tracking-[-0.03em]',
                      monthlyNet >= 0 ? 'text-success' : 'text-danger',
                    )}
                  >
                    {monthlyNet >= 0 ? '+' : '-'}
                    {formatCurrency(Math.abs(monthlyNet))}
                  </strong>
                  <span className="text-text-2">{activeWalletsLabel}</span>
                  {overallBudgetLimit > 0 ? (
                    <span className="text-text-2">{budgetStatusLabel}</span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-0 border-y border-border-subtle/90 sm:grid-cols-3 sm:divide-x sm:divide-border-subtle/90">
                <DashboardHeroMetric
                  label={t('dashboard.monthlyIncome')}
                  value={loading ? '...' : formatCurrency(totalIncome)}
                  tone="success"
                />
                <DashboardHeroMetric
                  label={t('dashboard.monthlyExpense')}
                  value={loading ? '...' : formatCurrency(totalExpense)}
                  tone="danger"
                  className="sm:border-0"
                />
                <DashboardHeroMetric
                  label={t('dashboard.monthlyTransfers')}
                  value={loading ? '...' : formatCurrency(totalTransfers)}
                  tone="accent"
                />
              </div>

              <div className="grid gap-2 border-t border-border-subtle/90 pt-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="grid gap-0.5">
                    <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                      {t('dashboard.walletSnapshotTitle')}
                    </span>
                    <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                      {walletSnapshotTitle}
                    </strong>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
                    <Link href="/wallets">{t('dashboard.viewAll')}</Link>
                  </Button>
                </div>

                {wallets.length > 0 ? (
                  <div className="grid gap-0 divide-y divide-border-subtle">
                    {topWallets.map((wallet) => (
                      <HeroWalletSummaryRow
                        key={wallet.id}
                        wallet={wallet}
                        totalBalance={totalWalletBalance}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                ) : (
                  <CompactEmptyLine
                    icon={<Wallet size={15} />}
                    label={
                      language === 'id'
                        ? 'Belum ada dompet aktif.'
                        : 'No active wallets yet.'
                    }
                  />
                )}

                {wallets.length > topWallets.length ? (
                  <span className="text-[0.76rem] text-text-2">
                    {language === 'id'
                      ? `+${wallets.length - topWallets.length} dompet lainnya`
                      : `+${wallets.length - topWallets.length} more wallets`}
                  </span>
                ) : null}
              </div>
            </div>
          </SurfaceCard>

          <DashboardDesktopSupportSection
            overallBudgetLimit={overallBudgetLimit}
            overallBudgetSpent={overallBudgetSpent}
            overallBudgetRemaining={overallBudgetRemaining}
            overallBudgetRatio={overallBudgetRatio}
            budgetTone={budgetTone}
            budgetStatusLabel={budgetStatusLabel}
            primaryWishlistItem={primaryWishlistItem}
            readyWishlistItemsCount={readyWishlistItemsCount}
            plannerLabel={plannerLabel}
            quickInputLabel={quickInputLabel}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
            onReviewQuickAdd={onReviewQuickAdd}
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.05fr)_minmax(22rem,0.95fr)] xl:items-start 2xl:grid-cols-[minmax(0,1.08fr)_minmax(23rem,0.92fr)]">
          <DashboardRecentTransactionsSection
            loading={loading}
            recentTransactions={recentTransactions}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
          />

          <DashboardDesktopInsightsSection
            insightView={insightView}
            onInsightViewChange={onInsightViewChange}
            language={language}
            t={t}
            barData={barData}
            categoryData={categoryData}
            hasCategoryBreakdown={hasCategoryBreakdown}
          />
        </div>
      </section>

      <section className="grid gap-2.5 sm:hidden">
        <SurfaceCard className="overflow-hidden">
          <div className="grid gap-2.75">
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <span className="text-[0.74rem] font-medium tracking-[0.08em] text-text-2">
                  {t('dashboard.totalBalance')}
                </span>
                <strong className="text-[clamp(2.3rem,2.1rem+1.35vw,3.1rem)] font-semibold leading-none tracking-[-0.08em] text-text-1">
                  {loading ? '...' : formatCurrency(totalBalance)}
                </strong>
              </div>
              <Badge variant="accent" className="self-start">
                {monthKey ?? '---- --'}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.82rem] text-text-2">
              <span>{netFlowLabel}</span>
              <strong
                className={cn(
                  'text-[0.88rem] font-semibold tracking-[-0.03em]',
                  monthlyNet >= 0 ? 'text-success' : 'text-danger',
                )}
              >
                {monthlyNet >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(monthlyNet))}
              </strong>
            </div>

            <div className="grid gap-2 border-t border-border-subtle/90 pt-2.5">
              <div className="grid grid-cols-2 gap-2">
                <DashboardMobilePrimaryMetric
                  label={t('dashboard.monthlyIncome')}
                  value={loading ? '...' : formatCurrency(totalIncome)}
                  tone="success"
                />
                <DashboardMobilePrimaryMetric
                  label={t('dashboard.monthlyExpense')}
                  value={loading ? '...' : formatCurrency(totalExpense)}
                  tone="danger"
                />
              </div>

              <div className="flex items-center justify-between gap-3 rounded-[calc(var(--radius-control)+0.02rem)] border border-border-subtle/80 bg-surface-2/42 px-3 py-2.5">
                <div className="grid gap-0.5">
                  <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                    {t('dashboard.monthlyTransfers')}
                  </span>
                  <strong className="text-[0.98rem] font-semibold tracking-[-0.045em] text-accent-strong">
                    {loading ? '...' : formatCurrency(totalTransfers)}
                  </strong>
                </div>
                <Badge variant="accent" className="min-h-0 px-2.5 py-1 text-[0.68rem] font-medium">
                  {activeWalletsLabel}
                </Badge>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <DashboardMobileSupportSection
          wallets={wallets}
          topWallets={topWallets}
          totalWalletBalance={totalWalletBalance}
          overallBudgetLimit={overallBudgetLimit}
          overallBudgetSpent={overallBudgetSpent}
          overallBudgetRemaining={overallBudgetRemaining}
          overallBudgetRatio={overallBudgetRatio}
          budgetStatusLabel={budgetStatusLabel}
          primaryWishlistItem={primaryWishlistItem}
          readyWishlistItemsCount={readyWishlistItemsCount}
          language={language}
          t={t}
          formatCurrency={formatCurrency}
        />

        {loading || recentTransactions.length > 0 ? (
          <DashboardRecentTransactionsSection
            loading={loading}
            recentTransactions={recentTransactions}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
            className="sm:hidden"
          />
        ) : null}
      </section>
    </>
  );
}

interface DashboardDesktopSupportSectionProps {
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  overallBudgetRatio: number;
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  readyWishlistItemsCount: number;
  plannerLabel: string;
  quickInputLabel: string;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  onReviewQuickAdd: (draft: TransactionFormPrefill) => void;
}

function DashboardDesktopSupportSection({
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  overallBudgetRatio,
  budgetTone,
  budgetStatusLabel,
  primaryWishlistItem,
  readyWishlistItemsCount,
  plannerLabel,
  quickInputLabel,
  language,
  t,
  formatCurrency,
  onReviewQuickAdd,
}: DashboardDesktopSupportSectionProps) {
  return (
    <SurfaceCard
      padding="compact"
      className="grid h-full content-start gap-3 border-border-strong/50"
    >
        <div className="grid gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="grid gap-0.5">
              <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                {quickInputLabel}
              </span>
            <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
              {t('nav.quickTransaction')}
            </strong>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
            <Link href="/transactions">{t('dashboard.quickAdd.openForm')}</Link>
          </Button>
        </div>
        <QuickAddComposer onReview={onReviewQuickAdd} />
      </div>

      <div className="h-px bg-border-subtle" />

      <div className="grid gap-2.5">
        <div className="grid gap-0.5">
          <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
            {plannerLabel}
          </span>
          <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
            {language === 'id'
              ? 'Budget dan wishlist prioritas'
              : 'Budget and wishlist priorities'}
          </strong>
        </div>

        <div className="grid gap-0 divide-y divide-border-subtle/90">
          <DashboardPlannerModule
            eyebrow={t('dashboard.budgetTitle')}
            href="/budgets"
            actionLabel={t('dashboard.viewAll')}
          >
            {overallBudgetLimit > 0 ? (
              <div className="grid gap-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid gap-0.5">
                    <strong className="text-lg font-semibold tracking-[-0.05em] text-text-1">
                      {formatCurrency(overallBudgetSpent)}
                    </strong>
                    <span className="text-[0.76rem] text-text-2">
                      {t('dashboard.budgetSpent')}
                    </span>
                  </div>
                  <Badge variant={toneToBadgeVariant[budgetTone]}>
                    {budgetStatusLabel}
                  </Badge>
                </div>
                <ProgressMeter
                  value={overallBudgetRatio}
                  tone={toneToProgressTone[budgetTone]}
                  className="h-1.5 bg-surface-1"
                  ariaLabel={t('dashboard.budgetTitle')}
                />
                <div className="flex items-center justify-between gap-2 text-[0.76rem] text-text-2">
                  <span>{formatCurrency(overallBudgetRemaining)}</span>
                  <span>{formatCurrency(overallBudgetLimit)}</span>
                </div>
              </div>
            ) : (
              <CompactEmptyLine
                icon={<Target size={15} />}
                label={t('dashboard.noBudget')}
              />
            )}
          </DashboardPlannerModule>

          <DashboardPlannerModule
            eyebrow={t('dashboard.wishlistTitle')}
            href="/wishlist"
            actionLabel={
              readyWishlistItemsCount > 0
                ? t('dashboard.reviewNow')
                : t('dashboard.viewAll')
            }
          >
            {primaryWishlistItem ? (
              <div className="grid gap-2">
                <div className="grid gap-0.5">
                  <strong className="truncate text-base font-semibold tracking-[-0.04em] text-text-1">
                    {primaryWishlistItem.item_name}
                  </strong>
                  <span className="text-[0.76rem] text-text-2">
                    {getWishlistCountdownLabel(primaryWishlistItem, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[0.76rem] text-text-2">
                  <span>
                    {readyWishlistItemsCount > 0
                      ? t('dashboard.reviewNow')
                      : t('dashboard.viewAll')}
                  </span>
                  <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
                    {formatCurrency(primaryWishlistItem.target_price ?? 0)}
                  </strong>
                </div>
              </div>
            ) : (
              <CompactEmptyLine
                icon={<Clock3 size={15} />}
                label={t('dashboard.noWishlistItems')}
              />
            )}
          </DashboardPlannerModule>
        </div>
      </div>
    </SurfaceCard>
  );
}

interface DashboardMobileSupportSectionProps {
  wallets: DashboardWalletSummary[];
  topWallets: DashboardWalletSummary[];
  totalWalletBalance: number;
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  overallBudgetRatio: number;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  readyWishlistItemsCount: number;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

function DashboardMobileSupportSection({
  wallets,
  topWallets,
  totalWalletBalance,
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  overallBudgetRatio,
  budgetStatusLabel,
  primaryWishlistItem,
  readyWishlistItemsCount,
  language,
  t,
  formatCurrency,
}: DashboardMobileSupportSectionProps) {
  const hasWallets = wallets.length > 0;
  const showSection =
    hasWallets || overallBudgetLimit > 0 || Boolean(primaryWishlistItem);

  if (!showSection) {
    return null;
  }

  const budgetMeta =
    overallBudgetLimit > 0
      ? `${formatCurrency(overallBudgetSpent)} / ${formatCurrency(overallBudgetLimit)}`
      : undefined;
  const wishlistMeta = primaryWishlistItem?.target_price
    ? formatCurrency(primaryWishlistItem.target_price)
    : readyWishlistItemsCount > 0
      ? language === 'id'
        ? `${readyWishlistItemsCount} siap ditinjau`
        : `${readyWishlistItemsCount} ready to review`
      : undefined;
  const walletSummaryLabel =
    language === 'id'
      ? `${wallets.length} dompet aktif`
      : `${wallets.length} active wallets`;

  return (
    <SurfaceCard padding="compact" className="grid gap-3 sm:hidden">
      <div className="grid grid-cols-2 gap-2">
        <MobilePriorityCard
          href="/budgets"
          eyebrow={t('dashboard.budgetTitle')}
          title={
            overallBudgetLimit > 0
              ? budgetStatusLabel
              : t('dashboard.noBudget')
          }
          value={
            overallBudgetLimit > 0
              ? language === 'id'
                ? `Sisa ${formatCurrency(overallBudgetRemaining)}`
                : `Remaining ${formatCurrency(overallBudgetRemaining)}`
              : undefined
          }
          meta={budgetMeta}
          tone={
            overallBudgetLimit > 0
              ? overallBudgetRatio >= 1
                ? 'danger'
                : overallBudgetRatio >= 0.8
                  ? 'warning'
                  : 'accent'
              : 'default'
          }
        />
        <MobilePriorityCard
          href="/wishlist"
          eyebrow={t('dashboard.wishlistTitle')}
          title={
            primaryWishlistItem
              ? primaryWishlistItem.item_name
              : t('dashboard.noWishlistItems')
          }
          value={
            primaryWishlistItem
              ? getWishlistCountdownLabel(primaryWishlistItem, language)
              : undefined
          }
          meta={wishlistMeta}
          tone={primaryWishlistItem ? 'accent' : 'default'}
        />
      </div>

      <div className="grid gap-2.5 border-t border-border-subtle/80 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="grid gap-0.5">
            <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
              {t('dashboard.walletSnapshotTitle')}
            </span>
            <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
              {walletSummaryLabel}
            </strong>
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
            <Link href="/wallets">{t('dashboard.viewAll')}</Link>
          </Button>
        </div>

        {hasWallets ? (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {topWallets.map((wallet) => (
              <MobileWalletStripCard
                key={wallet.id}
                wallet={wallet}
                totalBalance={totalWalletBalance}
                formatCurrency={formatCurrency}
              />
            ))}
          </div>
        ) : (
          <CompactEmptyLine
            icon={<Wallet size={15} />}
            label={
              language === 'id'
                ? 'Belum ada dompet aktif.'
                : 'No active wallets yet.'
            }
          />
        )}
      </div>
    </SurfaceCard>
  );
}

interface DashboardOnboardingSectionProps {
  loading: boolean;
  hasActivity: boolean;
  setupSteps: Array<{
    id: string;
    title: string;
    done: boolean;
    href: string;
  }>;
  nextSetupStep: {
    id: string;
    title: string;
    done: boolean;
    href: string;
  } | null;
  t: (path: string) => string;
}

export function DashboardOnboardingSection({
  loading,
  hasActivity,
  setupSteps,
  nextSetupStep,
  t,
}: DashboardOnboardingSectionProps) {
  if (loading || hasActivity) {
    return null;
  }

  return (
    <Card className="border-dashed p-3.5 md:p-4">
      <div className="grid gap-3">
        <SectionHeading
          eyebrow={t('dashboard.onboarding.eyebrow')}
          title={t('dashboard.onboarding.title')}
        />

        <div className="grid gap-2">
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
  );
}

interface DashboardRecentTransactionsSectionProps {
  loading: boolean;
  recentTransactions: TransactionDisplayItem[];
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  className?: string;
}

export function DashboardRecentTransactionsSection({
  loading,
  recentTransactions,
  language,
  t,
  formatCurrency,
  className,
}: DashboardRecentTransactionsSectionProps) {
  return (
    <SurfaceCard className={cn('h-full', className)}>
      <div className="grid h-full gap-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-[0.95rem] font-semibold tracking-[-0.035em] text-text-1">
            {t('dashboard.recentTransactions')}
          </h2>
          <Button asChild variant="ghost" size="sm" className="h-6.5 px-2.5 sm:h-7">
            <Link href="/transactions">{t('dashboard.viewAll')}</Link>
          </Button>
        </div>

        {loading ? (
          <EmptyState title={t('common.loading')} compact />
        ) : recentTransactions.length === 0 ? (
          <EmptyState
            title={t('dashboard.noTransactions')}
            compact
            icon={<ReceiptText size={18} />}
          />
        ) : (
          <div className="grid gap-0">
            {recentTransactions.map((transaction, index) => (
              <RecentActivityRow
                key={transaction.id}
                transaction={transaction}
                language={language}
                t={t}
                formatCurrency={formatCurrency}
                className={index > 0 ? 'border-t border-border-subtle' : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

interface DashboardDesktopInsightsSectionProps {
  insightView: DashboardInsightView;
  onInsightViewChange: (view: DashboardInsightView) => void;
  language: 'en' | 'id';
  t: (path: string) => string;
  barData: {
    labels: string[];
    income: number[];
    expense: number[];
  };
  categoryData: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  hasCategoryBreakdown: boolean;
}

export function DashboardDesktopInsightsSection({
  insightView,
  onInsightViewChange,
  language,
  t,
  barData,
  categoryData,
  hasCategoryBreakdown,
}: DashboardDesktopInsightsSectionProps) {
  return (
    <SurfaceCard className="hidden h-full sm:grid">
      <div className="grid h-full gap-3">
        <SectionHeading
          title={language === 'id' ? 'Insights' : 'Insights'}
          actions={
            <div className="inline-flex rounded-full border border-border-subtle bg-surface-2 p-1">
              <InsightToggleButton
                active={insightView === 'activity'}
                onClick={() => onInsightViewChange('activity')}
              >
                {language === 'id' ? 'Aktivitas' : 'Activity'}
              </InsightToggleButton>
              <InsightToggleButton
                active={insightView === 'breakdown'}
                onClick={() => onInsightViewChange('breakdown')}
              >
                {language === 'id' ? 'Kategori' : 'Category'}
              </InsightToggleButton>
            </div>
          }
        />

        {insightView === 'activity' ? (
          <div className="grid h-full gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[0.74rem] font-medium text-text-2">
              <ChartLegendLabel
                colorClassName="bg-success"
                label={t('dashboard.monthlyIncome')}
              />
              <ChartLegendLabel
                colorClassName="bg-danger"
                label={t('dashboard.monthlyExpense')}
              />
            </div>
            <ChartSurface className="h-full">
              <div className="h-[11.5rem] xl:h-[12rem] 2xl:h-[12.5rem]">
                <TransactionBarChart data={barData} />
              </div>
            </ChartSurface>
          </div>
        ) : (
          <div className="grid h-full gap-3">
            <ChartSurface className="h-full">
              <div className="h-[11.5rem] xl:h-[12rem] 2xl:h-[12.5rem]">
                {hasCategoryBreakdown ? (
                  <CategoryDoughnutChart data={categoryData} />
                ) : (
                  <div className="grid h-full place-items-center">
                    <EmptyState
                      title={t('dashboard.noExpenseData')}
                      compact
                      icon={<PieChart size={18} />}
                    />
                  </div>
                )}
              </div>
            </ChartSurface>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

interface DashboardMobilePanelsSectionProps {
  insightView: DashboardInsightView;
  onInsightViewChange: (view: DashboardInsightView) => void;
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  overallBudgetRatio: number;
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  categoryBudgetRows: Array<DashboardBudgetRecord & { spent: number; ratio: number }>;
  wishlistItems: DashboardWishlistItem[];
  wishlistHighlights: DashboardWishlistItem[];
  primaryWishlistItem: DashboardWishlistItem | null;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  barData: {
    labels: string[];
    income: number[];
    expense: number[];
  };
  categoryData: {
    labels: string[];
    values: number[];
    colors: string[];
  };
  hasCategoryBreakdown: boolean;
}

export function DashboardMobilePanelsSection({
  insightView,
  onInsightViewChange,
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  overallBudgetRatio,
  budgetTone,
  budgetStatusLabel,
  categoryBudgetRows,
  wishlistItems,
  wishlistHighlights,
  primaryWishlistItem,
  language,
  t,
  formatCurrency,
  barData,
  categoryData,
  hasCategoryBreakdown,
}: DashboardMobilePanelsSectionProps) {
  const hasActivityData =
    barData.income.some((value) => value > 0) ||
    barData.expense.some((value) => value > 0);
  const hasInsights = hasActivityData || hasCategoryBreakdown;
  const hasPlannerDetails =
    overallBudgetLimit > 0 || wishlistItems.length > 0 || categoryBudgetRows.length > 0;

  if (!hasInsights && !hasPlannerDetails) {
    return null;
  }

  return (
    <section className="grid gap-2.5 sm:hidden">
      {hasInsights ? (
        <MobileDisclosureCard
          title={language === 'id' ? 'Insights' : 'Insights'}
          description={
            insightView === 'activity'
              ? t('dashboard.weeklyActivity')
              : t('dashboard.expenseBreakdown')
          }
        >
          <div className="grid gap-3">
            <div className="inline-flex w-fit rounded-full border border-border-subtle bg-surface-2 p-1">
              <InsightToggleButton
                active={insightView === 'activity'}
                onClick={() => onInsightViewChange('activity')}
              >
                {language === 'id' ? 'Aktivitas' : 'Activity'}
              </InsightToggleButton>
              <InsightToggleButton
                active={insightView === 'breakdown'}
                onClick={() => onInsightViewChange('breakdown')}
              >
                {language === 'id' ? 'Kategori' : 'Category'}
              </InsightToggleButton>
            </div>

            {insightView === 'activity' ? (
              <div className="grid gap-3">
                <SectionHeading
                  title={t('dashboard.weeklyActivity')}
                  actions={
                    <div className="flex items-center gap-3 text-[0.74rem] font-medium text-text-2">
                      <ChartLegendLabel
                        colorClassName="bg-success"
                        label={t('dashboard.monthlyIncome')}
                      />
                      <ChartLegendLabel
                        colorClassName="bg-danger"
                        label={t('dashboard.monthlyExpense')}
                      />
                    </div>
                  }
                />
                <ChartSurface>
                  <div className="h-[13.5rem]">
                    <TransactionBarChart data={barData} />
                  </div>
                </ChartSurface>
              </div>
            ) : (
              <div className="grid gap-3">
                <SectionHeading title={t('dashboard.expenseBreakdown')} />
                <ChartSurface>
                  <div className="h-[13.5rem]">
                    {hasCategoryBreakdown ? (
                      <CategoryDoughnutChart data={categoryData} />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <EmptyState
                          title={t('dashboard.noExpenseData')}
                          compact
                          icon={<PieChart size={18} />}
                        />
                      </div>
                    )}
                  </div>
                </ChartSurface>
              </div>
            )}
          </div>
        </MobileDisclosureCard>
      ) : null}

      {hasPlannerDetails ? (
        <MobileDisclosureCard
          title={language === 'id' ? 'Budget & wishlist' : 'Budget & wishlist'}
          description={
            overallBudgetLimit > 0
              ? budgetStatusLabel
              : primaryWishlistItem
                ? primaryWishlistItem.item_name
                : undefined
          }
          defaultOpen={overallBudgetRatio >= 0.8}
        >
          <div className="grid gap-3">
            <div className="grid gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[0.76rem] font-medium tracking-[0.01em] text-text-2">
                  {t('dashboard.budgetTitle')}
                </strong>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
                  <Link href="/budgets">{t('dashboard.viewAll')}</Link>
                </Button>
              </div>

              {overallBudgetLimit > 0 ? (
                <div className="grid gap-2 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle/80 bg-surface-2/45 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid gap-0.5">
                      <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
                        {formatCurrency(overallBudgetSpent)}
                      </strong>
                      <span className="text-[0.78rem] text-text-2">
                        {t('dashboard.budgetSpent')}
                      </span>
                    </div>
                    <Badge variant={toneToBadgeVariant[budgetTone]}>
                      {budgetStatusLabel}
                    </Badge>
                  </div>

                  <ProgressMeter
                    value={overallBudgetRatio}
                    tone={toneToProgressTone[budgetTone]}
                    className="h-2 bg-surface-1"
                    ariaLabel={t('dashboard.budgetTitle')}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[0.78rem] text-text-2">
                    <span>
                      {t('dashboard.budgetRemaining')}: {formatCurrency(overallBudgetRemaining)}
                    </span>
                    <span>
                      {t('dashboard.budgetLimit')}: {formatCurrency(overallBudgetLimit)}
                    </span>
                  </div>
                </div>
              ) : (
                <CompactEmptyLine
                  icon={<Target size={15} />}
                  label={t('dashboard.noBudget')}
                />
              )}

              {categoryBudgetRows.length > 0 ? (
                <div className="grid gap-1.5">
                  {categoryBudgetRows.map((budget) => (
                    <BudgetUsageRow
                      key={budget.id}
                      budget={budget}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div className="h-px bg-border-subtle/80" />

            <div className="grid gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[0.76rem] font-medium tracking-[0.01em] text-text-2">
                  {t('dashboard.wishlistTitle')}
                </strong>
                <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
                  <Link href="/wishlist">
                    {primaryWishlistItem ? t('dashboard.reviewNow') : t('dashboard.viewAll')}
                  </Link>
                </Button>
              </div>

              {wishlistItems.length === 0 ? (
                <CompactEmptyLine
                  icon={<Clock3 size={15} />}
                  label={t('dashboard.noWishlistItems')}
                />
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
              )}
            </div>
          </div>
        </MobileDisclosureCard>
      ) : null}
    </section>
  );
}

export function DashboardQuickTransactionDialog({
  open,
  prefill,
  t,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  prefill: TransactionFormPrefill | null;
  t: (path: string) => string;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      title={t('transactions.form.new')}
      size="lg"
      padding="flush"
      hideClose
      headerHidden
    >
      <TransactionForm
        initialValues={prefill}
        createSource="quick_add"
        onSuccess={onSuccess}
        onCancel={() => onOpenChange(false)}
      />
    </ModalShell>
  );
}

function MobilePriorityCard({
  href,
  eyebrow,
  title,
  value,
  meta,
  tone = 'default',
}: {
  href: string;
  eyebrow: string;
  title: string;
  value?: string;
  meta?: string;
  tone?: 'default' | 'accent' | 'warning' | 'danger';
}) {
  const toneClassName = {
    default: 'border-border-subtle/80 bg-surface-2/35',
    accent: 'border-accent/20 bg-surface-accent/35',
    warning: 'border-warning/25 bg-warning-soft/25',
    danger: 'border-danger/25 bg-danger-soft/20',
  }[tone];

  return (
    <Link
      href={href}
      className={cn(
        'grid gap-1.25 rounded-[calc(var(--radius-card)-0.14rem)] border px-3 py-2.5 transition-all duration-300 hover:border-border-strong hover:bg-surface-2/65',
        toneClassName,
      )}
    >
      <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
        {eyebrow}
      </span>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
        {title}
      </strong>
      {value ? <span className="text-[0.78rem] text-text-2">{value}</span> : null}
      {meta ? <span className="text-[0.72rem] text-text-2">{meta}</span> : null}
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
  children: ReactNode;
}) {
  return (
    <details
      className="group rounded-[var(--radius-card)] border border-border-subtle bg-surface-1"
      open={defaultOpen}
    >
      <summary className="flex list-none items-center justify-between gap-3 px-3 py-2.75">
        <div className="grid gap-0.5">
          <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">
            {title}
          </strong>
          {description ? (
            <span className="text-[0.78rem] text-text-2">{description}</span>
          ) : null}
        </div>
        <span className="text-[0.78rem] font-medium text-text-2 transition-transform duration-300 group-open:rotate-180">
          v
        </span>
      </summary>
      <div className="border-t border-border-subtle px-3 py-2.75">
        {children}
      </div>
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
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/45 px-3 py-2.5">
      <span
        className={cn(
          'grid h-7 w-7 place-items-center rounded-full text-xs font-semibold',
          done
            ? 'bg-success-soft text-success'
            : active
              ? 'bg-accent-soft text-accent-strong'
              : 'bg-surface-1 text-text-3',
        )}
      >
        {done ? 'OK' : index}
      </span>
      <strong className="self-center text-sm font-semibold text-text-1">
        {title}
      </strong>
      {done ? (
        <Badge variant="success">{doneLabel}</Badge>
      ) : active ? (
        <Badge variant="accent">{activeLabel}</Badge>
      ) : null}
    </div>
  );
}

function DashboardMobilePrimaryMetric({
  label,
  value,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone: 'accent' | 'success' | 'danger';
  className?: string;
}) {
  const toneClassName = {
    accent: 'border-accent/18 bg-surface-1',
    success: 'border-success/18 bg-surface-1',
    danger: 'border-danger/20 bg-surface-1',
  }[tone];

  const dotClassName = {
    accent: 'bg-accent',
    success: 'bg-success',
    danger: 'bg-danger',
  }[tone];

  return (
    <div
      className={cn(
        'grid gap-1 rounded-[calc(var(--radius-control)+0.02rem)] border px-3 py-2.5',
        toneClassName,
        className,
      )}
    >
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} />
        <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="text-[1rem] font-semibold tracking-[-0.045em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

function DashboardHeroMetric({
  label,
  value,
  tone,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  tone: 'accent' | 'success' | 'danger';
  className?: string;
}) {
  const toneClassName = {
    accent: 'text-accent-strong',
    success: 'text-success',
    danger: 'text-danger',
  }[tone];

  return (
    <div className={cn('grid gap-1 px-3 py-2.5 sm:min-h-[4.45rem]', className)}>
      <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
        {label}
      </span>
      <strong className={cn('text-[1rem] font-semibold tracking-[-0.045em]', toneClassName)}>
        {value}
      </strong>
    </div>
  );
}

function DashboardPlannerModule({
  eyebrow,
  href,
  actionLabel,
  children,
}: {
  eyebrow: string;
  href: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2.5 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between gap-2">
        <strong className="text-[0.76rem] font-medium tracking-[0.01em] text-text-2">
          {eyebrow}
        </strong>
        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[0.72rem]">
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
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 text-[0.84rem] text-text-2">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-1 text-text-2">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  );
}

function HeroWalletSummaryRow({
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
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: wallet.color || 'var(--accent)' }}
        />
        <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
          {wallet.name}
        </strong>
      </div>
      <strong className="whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-text-1">
        {formatCurrency(wallet.balance)}
      </strong>
      <span className="text-[0.72rem] font-medium text-text-2">{share}%</span>
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[var(--chip-height)] items-center rounded-full px-3 text-[0.74rem] font-medium transition-all duration-300',
        active ? 'bg-surface-1 text-text-1 shadow-xs' : 'text-text-2 hover:text-text-1',
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
      className="grid min-w-[8.8rem] gap-1 rounded-[calc(var(--radius-card)-0.14rem)] border border-border-subtle/80 bg-surface-1 px-2.75 py-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: wallet.color || 'var(--accent)' }}
          />
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
            {wallet.name}
          </strong>
        </div>
        <span className="text-[0.7rem] font-medium text-text-2">{share}%</span>
      </div>
      <strong className="text-[0.94rem] font-semibold tracking-[-0.03em] text-text-1">
        {formatCurrency(wallet.balance)}
      </strong>
    </Link>
  );
}

function BudgetUsageRow({
  budget,
  formatCurrency,
}: {
  budget: DashboardBudgetRecord & { spent: number; ratio: number };
  formatCurrency: (amount: number) => string;
}) {
  const tone = getBudgetTone(budget.ratio);

  return (
    <div className="grid gap-2 rounded-[calc(var(--radius-card)-0.08rem)] border border-border-subtle bg-surface-2/55 p-3">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
          {budget.categories?.name || 'Category'}
        </strong>
        <span className="text-[0.74rem] font-medium text-text-2">
          {Math.min(Math.round(budget.ratio * 100), 999)}%
        </span>
      </div>
      <ProgressMeter
        value={budget.ratio}
        tone={toneToProgressTone[tone]}
        className="h-1.5 bg-surface-1"
        ariaLabel={budget.categories?.name || 'Category'}
      />
      <div className="flex items-center justify-between gap-3 text-[0.78rem] text-text-2">
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
  formatCurrency,
  className,
}: {
  transaction: TransactionDisplayItem;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  className?: string;
}) {
  if (transaction.kind === 'transfer') {
    const transferMeta = [transaction.fromWalletName, transaction.toWalletName]
      .filter(Boolean)
      .join(' -> ');
    const supportingMeta = transaction.note
      ? `${transferMeta} / ${transaction.note}`
      : transferMeta;

    return (
      <div
        className={cn(
          'grid min-h-[3.6rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-2.75 py-2 sm:min-h-[4rem] sm:gap-3 sm:px-3 sm:py-2.5',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-7.5 w-7.5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong sm:h-8 sm:w-8">
            <ArrowLeftRight size={16} />
          </span>
          <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
              {transaction.title}
            </strong>
            <span className="truncate text-[0.78rem] text-text-2">{supportingMeta}</span>
          </div>
        </div>
        <div className="grid gap-0.5 text-right">
          <strong className="text-sm font-semibold tracking-[-0.03em] text-accent-strong">
            {formatCurrency(transaction.amount)}
          </strong>
          <span className="text-[0.74rem] text-text-2">
            {formatShortDate(getTransactionDisplayDate(transaction), language)}
          </span>
        </div>
      </div>
    );
  }

  const toneClassName =
    transaction.type === 'income'
      ? 'bg-success-soft text-success'
      : 'bg-danger-soft text-danger';
  const supportingMeta = [
    transaction.wallets?.name || t('transactions.unknownWallet'),
    transaction.categories?.name || t('common.uncategorized'),
  ].join(' / ');

  return (
    <div
        className={cn(
        'grid min-h-[3.6rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-2.75 py-2 sm:min-h-[4rem] sm:gap-3 sm:px-3 sm:py-2.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className={cn('grid h-7.5 w-7.5 shrink-0 place-items-center rounded-full sm:h-8 sm:w-8', toneClassName)}>
          {getCategoryIcon(
            transaction.categories?.name,
            transaction.type,
            16,
            transaction.categories?.icon ?? undefined,
          )}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
            {transaction.title || transaction.note || t('common.noNote')}
          </strong>
          <span className="truncate text-[0.78rem] text-text-2">{supportingMeta}</span>
        </div>
      </div>
      <div className="grid gap-0.5 text-right">
        <strong
          className={cn(
            'text-sm font-semibold tracking-[-0.03em]',
            transaction.type === 'income' ? 'text-success' : 'text-danger',
          )}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </strong>
        <span className="text-[0.74rem] text-text-2">
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
  const ready =
    differenceInCalendarDays(parseISO(item.review_date), new Date()) <= 0;

  return (
    <Link
      href="/wishlist"
      className={cn(
        'flex min-h-[var(--list-row-min-height)] items-center justify-between gap-3.5 px-3 py-3 transition-all duration-300 hover:bg-surface-2/75',
        className,
      )}
    >
      <div className="grid min-w-0 gap-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'h-2.5 w-2.5 rounded-full',
              ready ? 'bg-accent-strong' : 'bg-border-strong',
            )}
          />
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
            {item.item_name}
          </strong>
        </div>
        <span className="truncate text-[0.78rem] text-text-2">
          {getWishlistCountdownLabel(item, language)}
        </span>
      </div>
      <strong className="whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-text-1">
        {item.target_price ? formatCurrency(item.target_price) : '-'}
      </strong>
    </Link>
  );
}

function ChartSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[calc(var(--radius-card)-0.08rem)] bg-surface-2/22 px-2 py-2 sm:px-2.5',
        className,
      )}
    >
      {children}
    </div>
  );
}
