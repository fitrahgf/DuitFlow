'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Wallet2,
} from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toDateInputValue } from '@/lib/date';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchActiveWallets, fetchCategories } from '@/lib/queries/reference';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from '@/lib/validators/transaction';

const compactSelectClassName =
  'flex min-h-[2.9rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition-all duration-300 hover:border-border-strong hover:bg-surface-2/55 focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

interface TransactionFormData {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  title: string | null;
  category_id: string | null;
  wallet_id: string | null;
  note: string | null;
  date: string;
  transaction_date?: string | null;
}

export interface TransactionFormPrefill {
  title?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category_id?: string;
  wallet_id?: string;
  note?: string;
  date?: string;
}

interface TransactionFormProps {
  transaction?: TransactionFormData | null;
  initialValues?: TransactionFormPrefill | null;
  defaultWalletId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
  variant?: 'dialog' | 'sheet';
  createSource?: 'manual' | 'quick_add' | 'wishlist_conversion';
}

function getDefaultValues(
  transaction?: TransactionFormData | null,
  defaultWalletId?: string | null,
  initialValues?: TransactionFormPrefill | null
): TransactionFormInput {
  const baseValues = initialValues ?? {};
  const values: Partial<TransactionFormInput> = {
    type: transaction?.type ?? baseValues.type ?? 'expense',
    title: transaction?.title ?? baseValues.title ?? transaction?.note ?? '',
    category_id: transaction?.category_id ?? baseValues.category_id ?? '',
    wallet_id: transaction?.wallet_id ?? baseValues.wallet_id ?? defaultWalletId ?? '',
    note: transaction?.note ?? baseValues.note ?? '',
    date: transaction?.transaction_date ?? transaction?.date ?? baseValues.date ?? toDateInputValue(),
  };

  if (transaction?.amount) {
    values.amount = transaction.amount;
  } else if (baseValues.amount) {
    values.amount = baseValues.amount;
  }

  return values as TransactionFormValues;
}

export default function TransactionForm({
  transaction,
  initialValues,
  defaultWalletId,
  onSuccess,
  onCancel,
  variant = 'dialog',
  createSource = 'manual',
}: TransactionFormProps) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const compactSheet = variant === 'sheet';
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormInput, undefined, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: getDefaultValues(transaction, defaultWalletId, initialValues),
  });

  const selectedType = useWatch({ control, name: 'type' });
  const selectedWalletId = useWatch({ control, name: 'wallet_id' });
  const selectedDate = useWatch({ control, name: 'date' });
  const transactionType = selectedType ?? 'expense';
  const formTitle = language === 'id' ? 'Detail transaksi' : 'Transaction details';
  const essentialTitle = language === 'id' ? 'Utama' : 'Essential';
  const detailsTitle = language === 'id' ? 'Detail' : 'Details';
  const optionalTitle = language === 'id' ? 'Opsional' : 'Optional';

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(transactionType),
    queryFn: () => fetchCategories(transactionType),
  });

  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });
  const selectedWalletName = wallets.find((wallet) => wallet.id === selectedWalletId)?.name || t('transactions.form.noWallets');

  useEffect(() => {
    reset(getDefaultValues(transaction, defaultWalletId, initialValues));
  }, [defaultWalletId, initialValues, reset, transaction]);

  useEffect(() => {
    if (!transaction?.wallet_id && !selectedWalletId && wallets.length > 0) {
      const fallbackWalletId = defaultWalletId ?? wallets[0].id;
      setValue('wallet_id', fallbackWalletId, { shouldDirty: false, shouldValidate: true });
    }
  }, [defaultWalletId, selectedWalletId, setValue, transaction?.wallet_id, wallets]);

  const transactionMutation = useMutation({
    mutationFn: async (values: TransactionFormValues) => {
      const supabase = createClient();
      const payload = {
        title: values.title.trim(),
        amount: values.amount,
        type: values.type,
        category_id: values.category_id || null,
        wallet_id: values.wallet_id,
        note: values.note?.trim() || null,
        date: values.date,
        transaction_date: values.date,
        ...(transaction?.id ? {} : { source: createSource }),
      };

      if (transaction?.id) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', transaction.id);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.from('transactions').insert(payload);
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
      toast.success(t('transactions.form.saveSuccess'));
      onSuccess();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('transactions.form.saveError')));
    },
  });

  return (
    <form
      className={cn('grid gap-3.5 rounded-[inherit] bg-surface-1 p-3.5 md:p-5', compactSheet && 'gap-3 p-0')}
      onSubmit={handleSubmit((values) => transactionMutation.mutate(values))}
    >
      {!compactSheet ? (
        <div className="grid gap-1.5">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-text-3">
            {transaction ? t('transactions.form.edit') : t('transactions.form.new')}
          </span>
          <h3 className="text-lg font-semibold tracking-[-0.04em]">{formTitle}</h3>
        </div>
      ) : null}

      <div className="grid gap-3">
        <FormSectionHeader step="01" title={essentialTitle} />

        <fieldset className="grid gap-2.5">
          <legend className="input-label">{t('transactions.form.type')}</legend>
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant={selectedType === 'expense' ? 'danger' : 'secondary'}
              fullWidth
              className="min-h-[2.9rem] justify-start rounded-[calc(var(--radius-card)-0.18rem)] px-3.5"
              onClick={() => setValue('type', 'expense', { shouldDirty: true })}
            >
              <ArrowDownLeft size={18} />
              {t('transactions.expense')}
            </Button>
            <Button
              type="button"
              variant={selectedType === 'income' ? 'primary' : 'secondary'}
              fullWidth
              className="min-h-[2.9rem] justify-start rounded-[calc(var(--radius-card)-0.18rem)] px-3.5"
              onClick={() => setValue('type', 'income', { shouldDirty: true })}
            >
              <ArrowUpRight size={18} />
              {t('transactions.income')}
            </Button>
          </div>
        </fieldset>

        <div className="grid gap-2.5 md:grid-cols-2">
          <div className="input-group md:col-span-2">
            <label className="input-label" htmlFor="transaction-amount">{t('transactions.form.amount')}</label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <CurrencyInput
                  id="transaction-amount"
                  name={field.name}
                  placeholder="500000"
                  value={field.value}
                  onBlur={field.onBlur}
                  onNumberValueChange={field.onChange}
                  ref={field.ref}
                    className="min-h-[2.95rem] px-3.5 py-2.5"
                    required
                  />
              )}
            />
            <FieldError message={errors.amount ? t('transactions.form.amountInvalid') : undefined} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="transaction-title">{t('transactions.form.title')}</label>
            <Input
              id="transaction-title"
              type="text"
              className="min-h-[2.95rem] px-3.5 py-2.5"
              placeholder={t('transactions.form.titlePlaceholder')}
              {...register('title')}
              required
            />
            <FieldError message={errors.title ? t('transactions.form.titleRequired') : undefined} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="transaction-wallet">{t('transactions.form.wallet')}</label>
            <select
              id="transaction-wallet"
              className={compactSelectClassName}
              {...register('wallet_id')}
              disabled={walletsLoading}
              required
            >
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
              {wallets.length === 0 ? <option value="">{t('transactions.form.noWallets')}</option> : null}
            </select>
            <FieldError message={errors.wallet_id ? t('transactions.form.walletRequired') : undefined} />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <FormSectionHeader step="02" title={detailsTitle} />

        <div className="grid gap-2.5 md:grid-cols-2">
          <div className="input-group">
            <label className="input-label" htmlFor="transaction-category">{t('transactions.form.category')}</label>
            <select
              id="transaction-category"
              className={compactSelectClassName}
              {...register('category_id')}
              disabled={categoriesLoading}
            >
              <option value="">{t('common.uncategorized')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="transaction-date">{t('transactions.form.date')}</label>
            <Input id="transaction-date" type="date" className="min-h-[2.95rem] px-3.5 py-2.5" {...register('date')} required />
          </div>
        </div>
      </div>

      <div className="grid gap-2.5">
        <FormSectionHeader step="03" title={optionalTitle} />

        <div className="input-group">
          <label className="input-label" htmlFor="transaction-note">{t('transactions.form.note')}</label>
          <Textarea
            id="transaction-note"
            className="min-h-[5rem] px-3.5 py-2.5"
            placeholder={t('transactions.form.notePlaceholder')}
            {...register('note')}
          />
        </div>
      </div>

      <Card className={cn('border-border-subtle bg-surface-2/55 p-3 shadow-none', compactSheet && 'p-3')}>
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-2">
          <SaveHint
            icon={transactionType === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownLeft size={15} />}
            value={transactionType === 'income' ? t('transactions.income') : t('transactions.expense')}
          />
          <SaveHint icon={<Wallet2 size={15} />} value={selectedWalletName} />
          <SaveHint icon={<CalendarDays size={15} />} value={selectedDate || toDateInputValue()} />
        </div>
      </Card>

      <div
        className={cn(
          'grid gap-2.5',
          compactSheet
            ? 'sticky bottom-0 z-10 -mx-1 grid-cols-1 border-t border-border-subtle bg-surface-1 px-1 pb-1 pt-3'
            : 'md:grid-cols-2'
        )}
      >
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={transactionMutation.isPending}>
          {transactionMutation.isPending ? t('categories.form.saving') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

function FormSectionHeader({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-text-3">
        {step}
      </span>
      <div className="grid gap-0.5">
        <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">{title}</strong>
        {description ? <span className="text-sm text-text-3">{description}</span> : null}
      </div>
    </div>
  );
}

function SaveHint({
  value,
  icon,
}: {
  value: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex min-h-[2rem] items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-2.5 py-1">
      <span className="text-text-3">{icon}</span>
      <span className="font-medium text-text-1">{value}</span>
    </span>
  );
}
