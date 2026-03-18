'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { AlertCircle, ArrowLeftRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import type { TransactionFormPrefill } from '@/components/TransactionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toDateInputValue } from '@/lib/date';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchActiveWallets, fetchCategories } from '@/lib/queries/reference';
import { fetchRecentLabeledTransactionsForSuggestions } from '@/lib/queries/transactions';
import { buildSuggestionModel, suggestCategory, suggestWallet } from '@/lib/smartSuggest';
import { parseSmartInput } from '@/lib/smartParser';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface QuickAddComposerProps {
  variant?: 'panel' | 'sheet' | 'dashboard';
  onReview: (draft: TransactionFormPrefill) => void;
  onSaved?: () => void;
}

function buildDraft(input: string, preview: ReturnType<typeof parseSmartInput>): TransactionFormPrefill {
  const title = preview.title || input.trim();

  return {
    title,
    amount: preview.amount || undefined,
    type: preview.type,
    wallet_id: preview.walletId ?? undefined,
    category_id: preview.categoryId ?? undefined,
    note: '',
    date: toDateInputValue(),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractMentionedWalletIds(input: string, wallets: Array<{ id: string; name: string }>) {
  const normalizedInput = input.toLowerCase();
  const mentioned = new Set<string>();
  const sortedWallets = [...wallets].sort((left, right) => right.name.length - left.name.length);

  for (const wallet of sortedWallets) {
    const normalizedWalletName = wallet.name.trim().toLowerCase();
    if (!normalizedWalletName) {
      continue;
    }

    const regex = new RegExp(`(?:^|\\s)${escapeRegExp(normalizedWalletName)}(?=\\s|$)`, 'i');

    if (regex.test(normalizedInput)) {
      mentioned.add(wallet.id);
    }
  }

  return mentioned;
}

function looksLikeTransferInput(input: string, wallets: Array<{ id: string; name: string }>) {
  if (!input.trim()) {
    return false;
  }

  const normalized = input.toLowerCase();
  if (normalized.includes('->')) {
    return true;
  }

  const mentionedWallets = extractMentionedWalletIds(input, wallets);
  return mentionedWallets.size >= 2;
}

export default function QuickAddComposer({
  variant = 'panel',
  onReview,
  onSaved,
}: QuickAddComposerProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [overrideCategoryId, setOverrideCategoryId] = useState<string | null>(null);
  const [overrideWalletId, setOverrideWalletId] = useState<string | null>(null);

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list('all'),
    queryFn: () => fetchCategories(),
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.transactions.list('suggestions'),
    queryFn: () => fetchRecentLabeledTransactionsForSuggestions(300),
    staleTime: 1000 * 60 * 10,
  });

  const walletLabelById = useMemo(
    () =>
      Object.fromEntries(
        (walletsQuery.data ?? []).map((wallet) => [wallet.id, wallet.name])
      ) as Record<string, string>,
    [walletsQuery.data]
  );

  const categoryLabelById = useMemo(
    () =>
      Object.fromEntries(
        (categoriesQuery.data ?? []).map((category) => [category.id, category.name])
      ) as Record<string, string>,
    [categoriesQuery.data]
  );

  const suggestionModel = useMemo(
    () => buildSuggestionModel(historyQuery.data ?? [], { language: 'auto' }),
    [historyQuery.data]
  );

  const previewBase =
    input.trim().length > 0
      ? parseSmartInput(input, {
          wallets: walletsQuery.data ?? [],
          categories: categoriesQuery.data ?? [],
        })
      : null;

  const preview = useMemo(() => {
    if (!previewBase) {
      return null;
    }

    const resolvedWalletId = overrideWalletId ?? previewBase.walletId;
    const resolvedCategoryId = overrideCategoryId ?? previewBase.categoryId;

    const resolvedWalletName =
      resolvedWalletId ? walletLabelById[resolvedWalletId] ?? previewBase.walletName : previewBase.walletName;
    const resolvedCategoryName =
      resolvedCategoryId
        ? categoryLabelById[resolvedCategoryId] ?? previewBase.categoryName
        : previewBase.categoryName;

    const missing = previewBase.missing.filter((field) => field !== 'wallet' || Boolean(resolvedWalletId));
    const status: typeof previewBase.status =
      missing.length === 0 ? 'ready' : missing.length === 3 ? 'invalid' : 'partial';

    return {
      ...previewBase,
      walletId: resolvedWalletId ?? null,
      walletName: resolvedWalletName ?? null,
      categoryId: resolvedCategoryId ?? null,
      categoryName: resolvedCategoryName ?? null,
      missing,
      status,
    };
  }, [categoryLabelById, overrideCategoryId, overrideWalletId, previewBase, walletLabelById]);

  const categorySuggestions = useMemo(() => {
    if (!preview || previewBase?.categoryId || !preview.title) {
      return [];
    }

    return suggestCategory(suggestionModel, preview.title, preview.type, categoryLabelById);
  }, [categoryLabelById, preview, previewBase?.categoryId, suggestionModel]);

  const walletSuggestions = useMemo(() => {
    if (!preview || previewBase?.walletId || !preview.title) {
      return [];
    }

    return suggestWallet(suggestionModel, preview.title, preview.type, walletLabelById);
  }, [preview, previewBase?.walletId, suggestionModel, walletLabelById]);

  const showSuggestions =
    input.trim().length > 0 && (categorySuggestions.length > 0 || walletSuggestions.length > 0);
  const showTransferHint = useMemo(() => {
    if (!input.trim()) {
      return false;
    }

    if (previewBase?.walletId) {
      return false;
    }

    const wallets = walletsQuery.data ?? [];
    if (wallets.length < 2) {
      return false;
    }

    return looksLikeTransferInput(input, wallets.map((wallet) => ({ id: wallet.id, name: wallet.name })));
  }, [input, previewBase?.walletId, walletsQuery.data]);

  const quickAddMutation = useMutation({
    mutationFn: async () => {
      if (!preview || preview.status !== 'ready') {
        throw new Error(t('dashboard.quickAdd.reviewRequired'));
      }

      const supabase = createClient();
      const payload = {
        amount: preview.amount,
        type: preview.type,
        title: preview.title,
        note: null,
        category_id: preview.categoryId,
        wallet_id: preview.walletId,
        source: 'quick_add',
        date: toDateInputValue(),
        transaction_date: toDateInputValue(),
      };

      const { error } = await supabase.from('transactions').insert(payload);

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      setInput('');
      setOverrideCategoryId(null);
      setOverrideWalletId(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.list('suggestions') }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('dashboard.quickAdd.saved'));
      onSaved?.();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('dashboard.quickAdd.saveError')));
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!preview) {
      return;
    }

    if (preview.status === 'ready') {
      quickAddMutation.mutate();
      return;
    }

    onReview(buildDraft(input, preview));
  };

  const statusLabel = preview
    ? preview.status === 'ready'
      ? t('dashboard.quickAdd.ready')
      : preview.status === 'partial'
        ? t('dashboard.quickAdd.partial')
        : t('dashboard.quickAdd.invalid')
      : null;

  const primaryActionLabel =
    preview?.status === 'ready'
      ? t('dashboard.quickAdd.confirm')
      : preview?.status === 'invalid'
        ? t('dashboard.quickAdd.openForm')
        : t('dashboard.quickAdd.editDetails');
  const examples =
    language === 'id'
      ? ['kopi 18rb cash', 'gaji 5jt bca', 'bensin 50k dana']
      : ['coffee 18k cash', 'salary 5m bca', 'fuel 50k dana'];
  const statusBadgeVariant =
    preview?.status === 'ready' ? 'success' : preview?.status === 'partial' ? 'warning' : 'default';
  const isPanel = variant === 'panel';
  const isDashboard = variant === 'dashboard';
  const controlGapClassName = isDashboard ? 'gap-1 sm:gap-1.5' : isPanel ? 'gap-2' : 'gap-2.5';
  const surfaceGapClassName = isDashboard ? 'gap-1 sm:gap-1.5' : isPanel ? 'gap-2' : 'gap-2.5';

  return (
    <div className={cn('grid', surfaceGapClassName)}>
      <form className={cn('grid', controlGapClassName)} onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('dashboard.smartInputPlaceholder')}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOverrideCategoryId(null);
            setOverrideWalletId(null);
          }}
          disabled={quickAddMutation.isPending}
        />

        {preview ? (
          <Card
            className={cn(
              'grid border shadow-none',
              isDashboard
                ? 'gap-1.5 rounded-[var(--radius-control)] border-border-subtle/55 bg-surface-1/80 p-2'
                : isPanel
                  ? 'gap-2 p-2.5 md:p-3'
                  : 'gap-2.5 p-3 md:p-3.5',
              preview.status === 'ready'
                ? isDashboard
                  ? 'border-success/18 bg-success-soft/24'
                  : 'border-success/18 bg-success-soft/35'
                : undefined,
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadgeVariant}>
                {preview.status === 'ready' ? <CheckCircle2 size={14} /> : <Sparkles size={14} />}
                {statusLabel}
              </Badge>
              {preview.usedDefaultWallet ? (
                <Badge variant="accent">{t('dashboard.quickAdd.defaultWallet')}</Badge>
              ) : null}
            </div>

            <div className="grid gap-2">
              <strong
                className={cn(
                  'font-semibold tracking-[-0.03em] text-text-1',
                  isDashboard ? 'text-[0.92rem]' : isPanel ? 'text-[0.95rem]' : 'text-base',
                )}
              >
                {preview.title || t('dashboard.quickAdd.missingTitle')}
              </strong>

              <div className={cn('flex flex-wrap', isDashboard ? 'gap-1.5' : 'gap-2')}>
                <QuickAddChip>
                  {preview.amount ? formatCurrency(preview.amount) : t('dashboard.quickAdd.missingAmount')}
                </QuickAddChip>
                <QuickAddChip>
                  {preview.walletName || t('dashboard.quickAdd.missingWallet')}
                </QuickAddChip>
                <QuickAddChip>{preview.type === 'income' ? t('transactions.income') : t('transactions.expense')}</QuickAddChip>
                {preview.categoryName ? <QuickAddChip>{preview.categoryName}</QuickAddChip> : null}
              </div>
            </div>

            {preview.missing.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preview.missing.map((field) => (
                  <Badge key={field} variant="warning">
                    {t('dashboard.quickAdd.fields.' + field)}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>
        ) : null}

        {showSuggestions || showTransferHint ? (
          <div
            className={cn(
              'grid rounded-[var(--radius-card)] border border-border-subtle bg-surface-2/55 animate-fade-in',
              isDashboard
                ? 'gap-1.5 rounded-[var(--radius-control)] border-border-subtle/55 bg-surface-1/72 p-2'
                : isPanel
                  ? 'gap-2 p-2.5'
                  : 'gap-2.5 p-3',
            )}
          >
            {showTransferHint ? (
              <Button asChild variant="secondary" className="justify-start">
                <Link href="/transfer">
                  <ArrowLeftRight size={18} />
                  {t('dashboard.quickAdd.transferHint')}
                </Link>
              </Button>
            ) : null}

            {categorySuggestions.length > 0 ? (
              <div className="grid gap-2">
                <p
                  className={cn(
                    'font-semibold text-text-3',
                    isDashboard
                      ? 'text-[0.72rem] tracking-[-0.01em]'
                      : 'text-[0.72rem] uppercase tracking-[0.16em]',
                  )}
                >
                  {t('dashboard.quickAdd.suggestedCategories')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {categorySuggestions.map((suggestion) => {
                    const selected = overrideCategoryId === suggestion.id;

                    return (
                      <Button
                        key={suggestion.id}
                        type="button"
                        variant={selected ? 'primary' : 'secondary'}
                        size="sm"
                        className={cn(
                          isDashboard
                            ? 'min-h-[2rem] rounded-[var(--radius-control)] px-2.5'
                            : isPanel
                              ? 'min-h-[2.25rem] rounded-[var(--radius-control)] px-3'
                              : 'min-h-[2.45rem] rounded-[var(--radius-control)] px-3',
                          selected && 'ring-2 ring-accent-soft',
                        )}
                        onClick={() => setOverrideCategoryId((current) => (current === suggestion.id ? null : suggestion.id))}
                        disabled={quickAddMutation.isPending}
                      >
                        {selected ? <CheckCircle2 size={18} /> : null}
                        {suggestion.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {walletSuggestions.length > 0 ? (
              <div className="grid gap-2">
                <p
                  className={cn(
                    'font-semibold text-text-3',
                    isDashboard
                      ? 'text-[0.72rem] tracking-[-0.01em]'
                      : 'text-[0.72rem] uppercase tracking-[0.16em]',
                  )}
                >
                  {t('dashboard.quickAdd.suggestedWallets')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {walletSuggestions.map((suggestion) => {
                    const selected = overrideWalletId === suggestion.id;

                    return (
                      <Button
                        key={suggestion.id}
                        type="button"
                        variant={selected ? 'primary' : 'secondary'}
                        size="sm"
                        className={cn(
                          isDashboard
                            ? 'min-h-[2rem] rounded-[var(--radius-control)] px-2.5'
                            : isPanel
                              ? 'min-h-[2.25rem] rounded-[var(--radius-control)] px-3'
                              : 'min-h-[2.45rem] rounded-[var(--radius-control)] px-3',
                          selected && 'ring-2 ring-accent-soft',
                        )}
                        onClick={() => setOverrideWalletId((current) => (current === suggestion.id ? null : suggestion.id))}
                        disabled={quickAddMutation.isPending}
                      >
                        {selected ? <CheckCircle2 size={18} /> : null}
                        {suggestion.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className={cn(
            'grid gap-1.5',
            preview?.status === 'ready' && !isDashboard
              ? 'sm:grid-cols-[minmax(0,1fr)_auto]'
              : 'sm:grid-cols-1',
          )}
        >
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={
              quickAddMutation.isPending ||
              !input.trim() ||
              walletsQuery.isLoading ||
              (walletsQuery.data?.length ?? 0) === 0
            }
          >
            {quickAddMutation.isPending ? '...' : primaryActionLabel}
          </Button>
          {preview?.status === 'ready' && !isDashboard ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onReview(buildDraft(input, preview))}
              disabled={quickAddMutation.isPending}
            >
              {t('dashboard.quickAdd.editDetails')}
            </Button>
          ) : null}
        </div>
      </form>

      {!preview ? (
        <div className={cn('flex flex-wrap', isDashboard ? 'gap-1' : 'gap-1.5')}>
          {examples.map((example) => (
            <Button
              key={example}
              type="button"
              variant="secondary"
              size="sm"
              className={cn(
                isDashboard
                  ? 'min-h-[1.7rem] rounded-[var(--radius-control)] px-2.25 text-[0.72rem] text-text-2 hover:text-text-1'
                  : isPanel
                    ? 'min-h-[2rem] rounded-[var(--radius-control)] px-3 text-accent-strong'
                    : 'min-h-[2.15rem] rounded-[var(--radius-control)] px-3 text-accent-strong',
              )}
              onClick={() => {
                setInput(example);
                setOverrideCategoryId(null);
                setOverrideWalletId(null);
                inputRef.current?.focus();
              }}
            >
              {example}
            </Button>
          ))}
        </div>
      ) : null}

      {(walletsQuery.data?.length ?? 0) === 0 && !walletsQuery.isLoading ? (
        isDashboard ? (
          <div className="inline-flex items-center gap-2 rounded-[var(--radius-control)] bg-warning-soft px-3 py-2 text-[0.82rem] text-text-2">
            <AlertCircle size={16} className="text-warning" />
            <span>{t('dashboard.quickAdd.noWallets')}</span>
          </div>
        ) : (
          <Card className="grid gap-2.5 border-warning/30 bg-warning-soft p-3.5">
            <AlertCircle size={18} className="text-warning" />
            <p className="text-sm text-text-2">{t('dashboard.quickAdd.noWallets')}</p>
          </Card>
        )
      ) : null}
    </div>
  );
}

function QuickAddChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-[var(--chip-height)] items-center rounded-full border border-border-subtle bg-surface-1 px-3 py-1 text-[0.84rem] font-medium text-text-2">
      {children}
    </span>
  );
}
