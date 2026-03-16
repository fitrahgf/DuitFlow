'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
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
import { parseSmartInput } from '@/lib/smartParser';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface QuickAddComposerProps {
  variant?: 'panel' | 'sheet';
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

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });

  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.list('all'),
    queryFn: () => fetchCategories(),
  });

  const preview =
    input.trim().length > 0
      ? parseSmartInput(input, {
          wallets: walletsQuery.data ?? [],
          categories: categoriesQuery.data ?? [],
        })
      : null;

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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
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

  return (
    <div className={cn('grid gap-4', variant === 'sheet' && 'gap-5')}>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <Input
          ref={inputRef}
          type="text"
          placeholder={t('dashboard.smartInputPlaceholder')}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={quickAddMutation.isPending}
        />

        {preview ? (
          <Card
            className={cn(
              'grid gap-3 border p-4 shadow-none',
              preview.status === 'ready'
                ? 'border-success/22 bg-success-soft/35'
                : 'border-border-subtle bg-surface-2/55'
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
              <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                {preview.title || t('dashboard.quickAdd.missingTitle')}
              </strong>

              <div className="flex flex-wrap gap-2">
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

        <div className={cn('grid gap-2', preview?.status === 'ready' ? 'sm:grid-cols-[minmax(0,1fr)_auto]' : 'sm:grid-cols-1')}>
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
          {preview?.status === 'ready' ? (
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
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="inline-flex items-center rounded-full border border-border-subtle bg-surface-2/55 px-3 py-1.5 text-sm text-accent-strong transition hover:border-border-strong hover:bg-surface-2"
              onClick={() => {
                setInput(example);
                inputRef.current?.focus();
              }}
            >
              {example}
            </button>
          ))}
        </div>
      ) : null}

      {(walletsQuery.data?.length ?? 0) === 0 && !walletsQuery.isLoading ? (
        <Card className="grid gap-3 border-warning/30 bg-warning-soft p-4">
          <AlertCircle size={18} className="text-warning" />
          <p className="text-sm text-text-2">{t('dashboard.quickAdd.noWallets')}</p>
        </Card>
      ) : null}
    </div>
  );
}

function QuickAddChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-surface-1 px-3 py-1.5 text-sm font-medium text-text-2">
      {children}
    </span>
  );
}
