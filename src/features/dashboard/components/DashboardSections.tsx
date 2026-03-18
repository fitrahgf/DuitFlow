'use client';

import type { ReactNode } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeftRight,
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
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  type BudgetTone,
} from '@/lib/budgetMath';
import { getCategoryIcon } from '@/lib/icons';
import type { DashboardWalletSummary, DashboardWishlistItem } from '@/lib/queries/dashboard';
import {
  getTransactionDisplayDate,
  type TransactionDisplayItem,
} from '@/lib/transactionFeed';
import { cn } from '@/lib/utils';

type DashboardInsightView = 'activity' | 'breakdown';

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

function normalizeHexColor(color?: string | null) {
  if (!color) {
    return null;
  }

  const trimmed = color.trim();
  if (!trimmed.startsWith('#')) {
    return null;
  }

  if (trimmed.length === 4) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }

  return trimmed.length === 7 ? trimmed : null;
}

function withHexAlpha(color: string | null | undefined, alpha: string) {
  const normalized = normalizeHexColor(color);
  return normalized ? `${normalized}${alpha}` : undefined;
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
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  readyWishlistItemsCount: number;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  onReviewQuickAdd: (draft: TransactionFormPrefill) => void;
}

export function DashboardTopSection({
  loading,
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
  budgetTone,
  budgetStatusLabel,
  primaryWishlistItem,
  readyWishlistItemsCount,
  language,
  t,
  formatCurrency,
  onReviewQuickAdd,
}: DashboardTopSectionProps) {
  const monthlyNet = totalIncome - totalExpense;
  const netFlowLabel =
    language === 'id' ? 'Arus bersih bulan ini' : 'Net flow this month';
  const plannerLabel =
    language === 'id' ? 'Fokus bulan ini' : 'Monthly focus';
  const quickInputLabel = language === 'id' ? 'Input cepat' : 'Quick input';
  const walletSummaryTitle =
    language === 'id' ? 'Ringkasan dompet' : 'Wallet summary';

  return (
    <>
      <section className="hidden gap-3 sm:grid">
        <SurfaceCard
          role="featured"
          padding="compact"
          className="border-border-strong/24 bg-surface-1/98"
        >
          <div className="grid gap-2">
            <div className="grid gap-1">
              <h2 className="m-0 text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2">
                {t('dashboard.totalBalance')}
              </h2>
              <strong className="text-[var(--number-hero-size)] font-semibold leading-none tracking-[-0.09em] text-text-1">
                {loading ? '...' : formatCurrency(totalBalance)}
              </strong>
              <div className="inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--font-size-meta)] text-text-2">
                <span>{netFlowLabel}</span>
                <strong
                  className={cn(
                    'text-[0.86rem] font-semibold tracking-[-0.03em]',
                    monthlyNet >= 0 ? 'text-success' : 'text-danger',
                  )}
                >
                  {monthlyNet >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(monthlyNet))}
                </strong>
              </div>
            </div>

            <div className="grid gap-2 border-t border-border-subtle/35 pt-2 sm:grid-cols-3">
              <DashboardHeroMetric
                label={t('dashboard.monthlyIncome')}
                value={loading ? '...' : formatCurrency(totalIncome)}
                tone="success"
              />
              <DashboardHeroMetric
                label={t('dashboard.monthlyExpense')}
                value={loading ? '...' : formatCurrency(totalExpense)}
                tone="danger"
              />
              <DashboardHeroMetric
                label={t('dashboard.monthlyTransfers')}
                value={loading ? '...' : formatCurrency(totalTransfers)}
                tone="accent"
              />
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-3 xl:grid-cols-[minmax(18.5rem,0.66fr)_minmax(0,1.34fr)] xl:items-start 2xl:grid-cols-[minmax(19rem,0.64fr)_minmax(0,1.36fr)]">
          <DashboardDesktopWalletSummarySection
            wallets={wallets}
            topWallets={topWallets}
            totalWalletBalance={totalWalletBalance}
            walletSummaryTitle={walletSummaryTitle}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
          />

          <DashboardDesktopQuickInputSection
            quickInputLabel={quickInputLabel}
            onReviewQuickAdd={onReviewQuickAdd}
          />
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.3fr)] xl:items-start 2xl:grid-cols-[minmax(17.5rem,0.68fr)_minmax(0,1.32fr)]">
          <DashboardDesktopFocusSection
            overallBudgetLimit={overallBudgetLimit}
            overallBudgetSpent={overallBudgetSpent}
            overallBudgetRemaining={overallBudgetRemaining}
            budgetTone={budgetTone}
            budgetStatusLabel={budgetStatusLabel}
            primaryWishlistItem={primaryWishlistItem}
            plannerLabel={plannerLabel}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
          />

          <DashboardRecentTransactionsSection
            loading={loading}
            recentTransactions={recentTransactions}
            language={language}
            t={t}
            formatCurrency={formatCurrency}
          />
        </div>
      </section>

      <section className="grid gap-2 sm:hidden">
        <SurfaceCard className="overflow-hidden">
          <div className="grid gap-2.5">
            <div className="grid gap-1">
              <span className="text-[0.74rem] font-medium tracking-[0.01em] text-text-2">
                {t('dashboard.totalBalance')}
              </span>
              <strong className="text-[clamp(2.18rem,2.02rem+1.2vw,2.9rem)] font-semibold leading-none tracking-[-0.082em] text-text-1">
                {loading ? '...' : formatCurrency(totalBalance)}
              </strong>
            </div>

            <div className="grid grid-cols-3 gap-1.5 border-t border-border-subtle/85 pt-2.5">
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
              <DashboardMobilePrimaryMetric
                label={t('dashboard.monthlyTransfers')}
                value={loading ? '...' : formatCurrency(totalTransfers)}
                tone="accent"
              />
            </div>
          </div>
        </SurfaceCard>

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

        <DashboardMobileFocusSection
          overallBudgetLimit={overallBudgetLimit}
          overallBudgetSpent={overallBudgetSpent}
          overallBudgetRemaining={overallBudgetRemaining}
          budgetTone={budgetTone}
          budgetStatusLabel={budgetStatusLabel}
          primaryWishlistItem={primaryWishlistItem}
          readyWishlistItemsCount={readyWishlistItemsCount}
          language={language}
          t={t}
          formatCurrency={formatCurrency}
        />

        <DashboardMobileWalletSummarySection
          wallets={wallets}
          topWallets={topWallets}
          language={language}
          t={t}
          formatCurrency={formatCurrency}
        />
      </section>
    </>
  );
}

interface DashboardDesktopSupportSectionProps {
  quickInputLabel: string;
  onReviewQuickAdd: (draft: TransactionFormPrefill) => void;
}

function DashboardDesktopQuickInputSection({
  quickInputLabel,
  onReviewQuickAdd,
}: DashboardDesktopSupportSectionProps) {
  return (
    <SurfaceCard
      role="embedded"
      padding="compact"
      className="grid h-full content-start gap-2.5 border-border-subtle/65 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-1)_90%,transparent),color-mix(in_srgb,var(--surface-accent)_36%,transparent))]"
    >
      <h2 className="m-0 text-[0.92rem] font-semibold tracking-[-0.04em] text-text-1">
        {quickInputLabel}
      </h2>
      <QuickAddComposer variant="dashboard" onReview={onReviewQuickAdd} />
    </SurfaceCard>
  );
}

interface DashboardDesktopWalletSummarySectionProps {
  wallets: DashboardWalletSummary[];
  topWallets: DashboardWalletSummary[];
  totalWalletBalance: number;
  walletSummaryTitle: string;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

function DashboardDesktopWalletSummarySection({
  wallets,
  topWallets,
  totalWalletBalance,
  walletSummaryTitle,
  language,
  t,
  formatCurrency,
}: DashboardDesktopWalletSummarySectionProps) {
  const featuredWallet = topWallets[0] ?? null;
  const secondaryWallets = topWallets.slice(1, 3);

  return (
    <SurfaceCard
      role="featured"
      padding="compact"
      className="grid gap-2.5 self-start border-border-strong/24"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="m-0 text-[0.92rem] font-semibold tracking-[-0.04em] text-text-1">
          {walletSummaryTitle}
        </h2>
        <Button asChild variant="ghost" size="sm" className="h-6 px-2 text-[0.74rem]">
          <Link href="/wallets">{t('dashboard.viewAll')}</Link>
        </Button>
      </div>

      {wallets.length > 0 ? (
        <div className="grid gap-2.5">
          {featuredWallet ? (
            <DashboardWalletFeaturedCard
              wallet={featuredWallet}
              totalBalance={totalWalletBalance}
              formatCurrency={formatCurrency}
              language={language}
            />
          ) : null}

          {secondaryWallets.length > 0 ? (
            <div className="grid gap-0 divide-y divide-border-subtle/80">
              {secondaryWallets.map((wallet) => (
                <DashboardWalletCompactRow
                  key={wallet.id}
                  wallet={wallet}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          ) : null}

          {wallets.length > topWallets.length ? (
            <span className="text-[var(--font-size-meta)] text-text-2">
              {language === 'id'
                ? `+${wallets.length - topWallets.length} dompet lainnya`
                : `+${wallets.length - topWallets.length} more wallets`}
            </span>
          ) : null}
        </div>
      ) : (
        <CompactEmptyLine
          icon={<Wallet size={15} />}
          label={
            language === 'id' ? 'Belum ada dompet aktif.' : 'No active wallets yet.'
          }
        />
      )}
    </SurfaceCard>
  );
}

interface DashboardDesktopFocusSectionProps {
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  plannerLabel: string;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

function DashboardDesktopFocusSection({
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  budgetTone,
  budgetStatusLabel,
  primaryWishlistItem,
  plannerLabel,
  language,
  t,
  formatCurrency,
}: DashboardDesktopFocusSectionProps) {
  const hasBudget = overallBudgetLimit > 0;
  const hasWishlist = Boolean(primaryWishlistItem);
  const showCombinedEmpty = !hasBudget && !hasWishlist;
  const wishlistItem = primaryWishlistItem;
  const budgetEmptyLabel = language === 'id' ? 'Belum diatur' : 'Not set';
  const wishlistEmptyLabel =
    language === 'id' ? 'Belum ada prioritas' : 'No priority yet';

  return (
    <SurfaceCard
      role="embedded"
      padding="compact"
      className="grid gap-2.5 self-start border-border-subtle/65"
    >
      <h2 className="m-0 text-[0.88rem] font-semibold tracking-[-0.04em] text-text-1">
        {plannerLabel}
      </h2>

      <div className="grid gap-2 sm:grid-cols-1">
        <DashboardFocusMiniBlock
          href="/budgets"
          label={t('dashboard.budgetTitle')}
          status={hasBudget ? budgetStatusLabel : budgetEmptyLabel}
          meta={
            hasBudget
              ? `${formatCurrency(overallBudgetSpent)} / ${formatCurrency(overallBudgetLimit)}`
              : undefined
          }
          value={hasBudget ? formatCurrency(overallBudgetRemaining) : undefined}
          valueTone={hasBudget ? toneToBadgeVariant[budgetTone] : 'default'}
          muted={!hasBudget && !showCombinedEmpty}
        />
        <DashboardFocusMiniBlock
          href="/wishlist"
          label={t('dashboard.wishlistTitle')}
          status={
            hasWishlist && wishlistItem
              ? wishlistItem.item_name
              : wishlistEmptyLabel
          }
          meta={
            hasWishlist && wishlistItem
              ? getWishlistCountdownLabel(wishlistItem, language)
              : showCombinedEmpty
                ? language === 'id'
                  ? 'Belum ada item prioritas'
                  : 'No priority item yet'
                : undefined
          }
          value={
            hasWishlist && wishlistItem?.target_price
              ? formatCurrency(wishlistItem.target_price)
              : undefined
          }
          muted={!hasWishlist && !showCombinedEmpty}
        />
      </div>
    </SurfaceCard>
  );
}

interface DashboardMobileFocusSectionProps {
  overallBudgetLimit: number;
  overallBudgetSpent: number;
  overallBudgetRemaining: number;
  budgetTone: BudgetTone;
  budgetStatusLabel: string;
  primaryWishlistItem: DashboardWishlistItem | null;
  readyWishlistItemsCount: number;
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

function DashboardMobileFocusSection({
  overallBudgetLimit,
  overallBudgetSpent,
  overallBudgetRemaining,
  budgetTone,
  budgetStatusLabel,
  primaryWishlistItem,
  readyWishlistItemsCount,
  language,
  t,
  formatCurrency,
}: DashboardMobileFocusSectionProps) {
  const hasBudget = overallBudgetLimit > 0;
  const hasWishlist = Boolean(primaryWishlistItem) || readyWishlistItemsCount > 0;
  const isEmpty = !hasBudget && !hasWishlist;

  const budgetValueToneClassName =
    budgetTone === 'danger'
      ? 'text-danger'
      : budgetTone === 'warning'
        ? 'text-warning'
        : 'text-text-1';

  return (
      <SurfaceCard role="featured" padding="compact" className="grid gap-1.5 sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="m-0 text-[0.94rem] font-semibold tracking-[-0.04em] text-text-1">
          {language === 'id' ? 'Fokus bulan ini' : 'Monthly focus'}
        </h2>
      </div>

      {isEmpty ? (
        <CompactEmptyLine
          icon={<Target size={15} />}
          label={
            language === 'id'
              ? 'Belum ada budget atau wishlist prioritas.'
              : 'No budget or wishlist priorities yet.'
          }
        />
      ) : (
        <div className="grid gap-0 divide-y divide-border-subtle/80">
        {hasBudget ? (
          <MobileFocusRow
            href="/budgets"
            label={t('dashboard.budgetTitle')}
            meta={`${formatCurrency(overallBudgetSpent)} / ${formatCurrency(overallBudgetLimit)}`}
            value={formatCurrency(overallBudgetRemaining)}
            valueClassName={budgetValueToneClassName}
            hint={budgetStatusLabel}
          />
        ) : null}

        {hasWishlist ? (
          <MobileFocusRow
            href="/wishlist"
            label={t('dashboard.wishlistTitle')}
            meta={
              primaryWishlistItem
                ? getWishlistCountdownLabel(primaryWishlistItem, language)
                : language === 'id'
                  ? `${readyWishlistItemsCount} siap ditinjau`
                  : `${readyWishlistItemsCount} ready to review`
            }
            value={
              primaryWishlistItem?.target_price
                ? formatCurrency(primaryWishlistItem.target_price)
                : undefined
            }
            hint={primaryWishlistItem?.item_name ?? t('dashboard.noWishlistItems')}
          />
        ) : null}
        </div>
      )}
    </SurfaceCard>
  );
}

interface DashboardMobileWalletSummarySectionProps {
  wallets: DashboardWalletSummary[];
  topWallets: DashboardWalletSummary[];
  language: 'en' | 'id';
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
}

function DashboardMobileWalletSummarySection({
  wallets,
  topWallets,
  language,
  t,
  formatCurrency,
}: DashboardMobileWalletSummarySectionProps) {
  if (wallets.length === 0) {
    return null;
  }

  return (
    <SurfaceCard role="embedded" padding="compact" className="grid gap-2 sm:hidden">
      <div className="flex items-center justify-between gap-2">
        <div className="grid gap-0.5">
          <h2 className="m-0 text-[0.94rem] font-semibold tracking-[-0.04em] text-text-1">
            {t('dashboard.walletSnapshotTitle')}
          </h2>
          <span className="text-[0.76rem] text-text-2">
            {language === 'id'
              ? `${wallets.length} dompet aktif`
              : `${wallets.length} active wallets`}
          </span>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-7 px-2.5">
          <Link href="/wallets">{t('dashboard.viewAll')}</Link>
        </Button>
      </div>

      {topWallets[0] ? (
        <Link
          href="/wallets"
          className="grid gap-1.5 rounded-[calc(var(--radius-card)-0.16rem)] border border-border-subtle/70 bg-surface-1/78 px-3 py-3"
        >
          <span className="text-[0.7rem] font-medium tracking-[0.01em] text-text-2">
            {language === 'id' ? 'Dompet utama' : 'Primary wallet'}
          </span>
          <strong className="truncate text-[0.92rem] font-semibold tracking-[-0.03em] text-text-1">
            {topWallets[0].name}
          </strong>
          <strong className="text-[1.14rem] font-semibold tracking-[-0.05em] text-text-1">
            {formatCurrency(topWallets[0].balance)}
          </strong>
        </Link>
      ) : null}

      <div className="grid gap-0 divide-y divide-border-subtle/80">
        {topWallets.slice(1, 3).map((wallet) => (
          <MobileWalletListRow
            key={wallet.id}
            wallet={wallet}
            formatCurrency={formatCurrency}
          />
        ))}
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
    <SurfaceCard
      role="embedded"
      padding="compact"
      className={cn('h-full border-border-subtle/65', className)}
    >
      <div className="grid h-full gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-[0.94rem] font-semibold tracking-[-0.04em] text-text-1">
            {t('dashboard.recentTransactions')}
          </h2>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[0.74rem]"
          >
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
                className={index > 0 ? 'border-t border-border-subtle/70' : undefined}
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
    <SurfaceCard
      role="embedded"
      padding="compact"
      className="hidden h-full border-border-subtle/65 sm:grid"
    >
      <div className="grid h-full gap-2">
        <div className="flex items-center justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 className="m-0 text-[0.9rem] font-semibold tracking-[-0.04em] text-text-1">
              {language === 'id' ? 'Insights' : 'Insights'}
            </h2>
            <span className="text-[0.76rem] leading-5 text-text-2">
              {insightView === 'activity'
                ? t('dashboard.weeklyActivity')
                : t('dashboard.expenseBreakdown')}
            </span>
          </div>
          <div className="inline-flex rounded-full border border-border-subtle/55 bg-surface-1/72 p-0.5">
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
        </div>

        {insightView === 'activity' ? (
          <div className="grid h-full gap-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-medium text-text-2">
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
              <div className="h-[9.4rem] xl:h-[9.8rem] 2xl:h-[10.1rem]">
                <TransactionBarChart data={barData} minHeight={150} />
              </div>
            </ChartSurface>
          </div>
        ) : (
          <div className="grid h-full gap-1.5">
            <ChartSurface className="h-full">
              <div className="h-[9.4rem] xl:h-[9.8rem] 2xl:h-[10.1rem]">
                {hasCategoryBreakdown ? (
                  <CategoryDoughnutChart data={categoryData} minHeight={150} />
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
  language,
  t,
  barData,
  categoryData,
  hasCategoryBreakdown,
}: DashboardMobilePanelsSectionProps) {
  const hasActivityData =
    barData.income.some((value) => value > 0) ||
    barData.expense.some((value) => value > 0);
  const hasInsights = hasActivityData || hasCategoryBreakdown;

  if (!hasInsights) {
    return null;
  }

  return (
    <section className="grid gap-2.5 sm:hidden">
      <MobileDisclosureCard
        title={language === 'id' ? 'Insights' : 'Insights'}
        description={
          insightView === 'activity'
            ? t('dashboard.weeklyActivity')
            : t('dashboard.expenseBreakdown')
        }
      >
        <div className="grid gap-2.5">
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
            <div className="grid gap-2">
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
              <ChartSurface>
                <div className="h-[12.5rem]">
                  <TransactionBarChart data={barData} minHeight={200} />
                </div>
              </ChartSurface>
            </div>
          ) : (
            <ChartSurface>
              <div className="h-[12.5rem]">
                {hasCategoryBreakdown ? (
                  <CategoryDoughnutChart data={categoryData} minHeight={200} />
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
          )}
        </div>
      </MobileDisclosureCard>
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
      density="compact"
      hideClose
      headerHidden
    >
      <TransactionForm
        initialValues={prefill}
        createSource="quick_add"
        presentation="minimal"
        onSuccess={onSuccess}
        onCancel={() => onOpenChange(false)}
      />
    </ModalShell>
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
        <span className="text-[var(--font-size-chip)] font-medium text-success">{doneLabel}</span>
      ) : active ? (
        <span className="text-[var(--font-size-chip)] font-medium text-accent-strong">{activeLabel}</span>
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
        'grid min-w-0 gap-0.75 rounded-[calc(var(--radius-control)+0.02rem)] border px-2.5 py-2',
        toneClassName,
        className,
      )}
    >
      <div className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} />
        <span className="truncate text-[0.7rem] font-medium tracking-[-0.01em] text-text-2">
          {label}
        </span>
      </div>
      <strong className="truncate text-[0.92rem] font-semibold tracking-[-0.045em] text-text-1">
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
    <div className={cn('grid gap-0.5 sm:min-h-0', className)}>
      <span className="text-[0.68rem] font-medium tracking-[0.01em] text-text-2">
        {label}
      </span>
      <strong className={cn('text-[0.94rem] font-semibold tracking-[-0.04em]', toneClassName)}>
        {value}
      </strong>
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

function DashboardWalletFeaturedCard({
  wallet,
  totalBalance,
  formatCurrency,
  language,
}: {
  wallet: DashboardWalletSummary;
  totalBalance: number;
  formatCurrency: (amount: number) => string;
  language: 'en' | 'id';
}) {
  const share = getWalletShare(wallet, totalBalance);
  const accentColor = normalizeHexColor(wallet.color) ?? 'var(--accent)';
  const accentBorderColor = withHexAlpha(wallet.color, '2c');
  const accentBackgroundColor = withHexAlpha(wallet.color, '12');
  const accentChipColor = withHexAlpha(wallet.color, '16');

  return (
    <Link
      href="/wallets"
      className="grid gap-2.5 rounded-[calc(var(--radius-card)-0.12rem)] border border-border-subtle/60 bg-surface-1/90 px-3.5 py-3.5 transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-[1px] hover:bg-surface-1 hover:shadow-sm"
      style={{
        borderColor: accentBorderColor,
        backgroundColor: accentBackgroundColor,
      }}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[0.9rem] border border-white/65 bg-surface-1/82"
          style={{
            color: accentColor,
            backgroundColor: accentChipColor,
          }}
        >
          <Wallet size={15} />
        </span>
        <span className="inline-flex min-h-[1.35rem] items-center rounded-full bg-surface-1/78 px-2 py-0.5 text-[var(--font-size-chip)] font-medium text-text-2">
          {language === 'id' ? 'Utama' : 'Primary'}
        </span>
      </div>
      <div className="grid gap-1">
        <strong className="truncate text-[0.88rem] font-semibold tracking-[-0.02em] text-text-1">
            {wallet.name}
        </strong>
        <strong className="whitespace-nowrap text-[var(--number-section-size)] font-semibold tracking-[-0.05em] text-text-1">
          {formatCurrency(wallet.balance)}
        </strong>
        <span className="text-[var(--font-size-meta)] font-medium text-text-2">
          {language === 'id' ? `${share}% dari total` : `${share}% of total`}
        </span>
      </div>
    </Link>
  );
}

function DashboardWalletCompactRow({
  wallet,
  formatCurrency,
}: {
  wallet: DashboardWalletSummary;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <Link
      href="/wallets"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0 last:pb-0"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: wallet.color || 'var(--accent)' }}
        />
        <strong className="truncate text-[0.86rem] font-semibold tracking-[-0.02em] text-text-1">
          {wallet.name}
        </strong>
      </div>
      <strong className="whitespace-nowrap text-[0.9rem] font-semibold tracking-[-0.03em] text-text-1">
        {formatCurrency(wallet.balance)}
      </strong>
    </Link>
  );
}

function DashboardFocusMiniBlock({
  href,
  label,
  status,
  meta,
  value,
  valueTone = 'default',
  muted = false,
}: {
  href: string;
  label: string;
  status: string;
  meta?: string;
  value?: string;
  valueTone?: 'default' | 'accent' | 'success' | 'warning' | 'danger';
  muted?: boolean;
}) {
  const valueToneClassName = {
    default: 'text-text-1',
    accent: 'text-accent-strong',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
  }[valueTone];

  return (
    <Link
      href={href}
      className={cn(
        'grid gap-1.5 rounded-[calc(var(--radius-control)+0.02rem)] border border-border-subtle/55 px-3 py-2.5 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-[1px] hover:border-border-strong/45',
        muted ? 'bg-surface-1/46' : 'bg-surface-1/88',
      )}
    >
      <span className="text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2">
        {label}
      </span>
      <strong className="truncate text-[0.82rem] font-semibold tracking-[-0.03em] text-text-1">
        {status}
      </strong>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[var(--font-size-meta)] text-text-2">
        {meta ? <span className="truncate">{meta}</span> : <span className="sr-only">-</span>}
        {value ? (
          <strong
            className={cn(
              'whitespace-nowrap font-semibold tracking-[-0.02em]',
              valueToneClassName,
            )}
          >
            {value}
          </strong>
        ) : null}
      </div>
    </Link>
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
        'inline-flex min-h-[1.72rem] items-center rounded-full px-2.25 text-[0.66rem] font-medium transition-all duration-300',
        active
          ? 'bg-surface-1/92 text-text-1 shadow-[0_6px_16px_-16px_rgba(15,23,42,0.45)]'
          : 'text-text-2 hover:text-text-1',
      )}
    >
      {children}
    </button>
  );
}

function MobileFocusRow({
  href,
  label,
  hint,
  meta,
  value,
  valueClassName,
}: {
  href: string;
  label: string;
  hint: string;
  meta?: string;
  value?: string;
  valueClassName?: string;
}) {
  return (
    <Link
      href={href}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0 last:pb-0"
    >
      <div className="grid min-w-0 gap-0.5">
        <span className="text-[var(--font-size-meta)] font-medium tracking-[-0.01em] text-text-2">
          {label}
        </span>
        <strong className="truncate text-sm font-semibold tracking-[-0.03em] text-text-1">
          {hint}
        </strong>
      </div>
      <div className="grid justify-items-end gap-0.5 text-right">
        {value ? (
          <strong
            className={cn(
              'whitespace-nowrap text-sm font-semibold tracking-[-0.03em] text-text-1',
              valueClassName,
            )}
          >
            {value}
          </strong>
        ) : null}
        {meta ? <span className="text-[var(--font-size-meta)] text-text-2">{meta}</span> : null}
      </div>
    </Link>
  );
}

function MobileWalletListRow({
  wallet,
  formatCurrency,
}: {
  wallet: DashboardWalletSummary;
  formatCurrency: (amount: number) => string;
}) {
  return (
    <Link
      href="/wallets"
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5 first:pt-0 last:pb-0"
    >
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
    </Link>
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
    const supportingMeta = [transaction.fromWalletName, transaction.toWalletName]
      .filter(Boolean)
      .join(' -> ');

    return (
      <div
        className={cn(
          'grid min-h-[2.56rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-0.5 py-1.25 sm:min-h-[2.9rem] sm:gap-2 sm:px-1.5 sm:py-1.5',
          className,
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
            <span className="grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong sm:h-6 sm:w-6">
              <ArrowLeftRight size={14} />
            </span>
            <div className="grid min-w-0 gap-0.5">
            <strong className="truncate text-[0.88rem] font-semibold tracking-[-0.02em] text-text-1">
              {transaction.title}
            </strong>
            <span className="truncate text-[var(--font-size-meta)] text-text-2">{supportingMeta}</span>
          </div>
        </div>
        <div className="grid gap-0.5 text-right">
          <strong className="text-[0.88rem] font-semibold tracking-[-0.03em] text-accent-strong">
            {formatCurrency(transaction.amount)}
          </strong>
          <span className="text-[var(--font-size-meta)] text-text-2">
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
  const supportingMeta =
    transaction.categories?.name ||
    transaction.wallets?.name ||
    t('common.uncategorized');

  return (
    <div
      className={cn(
        'grid min-h-[2.56rem] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 px-0.5 py-1.25 sm:min-h-[2.9rem] sm:gap-2 sm:px-1.5 sm:py-1.5',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={cn(
            'grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full sm:h-6 sm:w-6',
            toneClassName,
          )}
        >
          {getCategoryIcon(
            transaction.categories?.name,
            transaction.type,
            15,
            transaction.categories?.icon ?? undefined,
          )}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-[0.88rem] font-semibold tracking-[-0.02em] text-text-1">
            {transaction.title || transaction.note || t('common.noNote')}
          </strong>
          <span className="truncate text-[var(--font-size-meta)] text-text-2">{supportingMeta}</span>
        </div>
      </div>
      <div className="grid gap-0.5 text-right">
        <strong
          className={cn(
            'text-[0.88rem] font-semibold tracking-[-0.03em]',
            transaction.type === 'income' ? 'text-success' : 'text-danger',
          )}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </strong>
        <span className="text-[var(--font-size-meta)] text-text-2">
          {formatShortDate(getTransactionDisplayDate(transaction), language)}
        </span>
      </div>
    </div>
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
        'rounded-[calc(var(--radius-card)-0.18rem)] border border-border-subtle/35 bg-surface-1/54 px-1.5 py-1 sm:px-2',
        className,
      )}
    >
      {children}
    </div>
  );
}
