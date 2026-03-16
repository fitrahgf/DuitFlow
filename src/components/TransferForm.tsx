'use client';

import type { ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, CalendarDays, Wallet2 } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import { FieldError } from '@/components/shared/FieldError';
import { useLanguage } from '@/components/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { toDateInputValue } from '@/lib/date';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchActiveWallets } from '@/lib/queries/reference';
import type { TransferListItem } from '@/lib/queries/transfers';
import { createClient } from '@/lib/supabase/client';
import {
  transferFormSchema,
  type TransferFormInput,
  type TransferFormValues,
} from '@/lib/validators/transfer';

const compactSelectClassName =
  'flex min-h-[2.75rem] w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface-1 px-3.5 py-2.5 text-sm text-text-1 outline-none transition hover:border-border-strong focus:border-accent focus:ring-4 focus:ring-accent-soft/70';

interface TransferFormProps {
  transfer?: TransferListItem | null;
  initialFromWalletId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function getDefaultValues(
  transfer?: TransferListItem | null,
  initialFromWalletId?: string | null
): TransferFormInput {
  const values: Partial<TransferFormInput> = {
    from_wallet_id: transfer?.from_wallet_id ?? initialFromWalletId ?? '',
    to_wallet_id: transfer?.to_wallet_id ?? '',
    fee_amount: transfer?.fee_amount ?? 0,
    note: transfer?.note ?? '',
    transfer_date: transfer?.transfer_date ?? toDateInputValue(),
  };

  if (transfer?.amount) {
    values.amount = transfer.amount;
  }

  return values as TransferFormValues;
}

export default function TransferForm({
  transfer,
  initialFromWalletId,
  onSuccess,
  onCancel,
}: TransferFormProps) {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const queryClient = useQueryClient();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormInput, undefined, TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: getDefaultValues(transfer, initialFromWalletId),
  });

  const fromWalletId = useWatch({ control, name: 'from_wallet_id' });
  const toWalletId = useWatch({ control, name: 'to_wallet_id' });
  const amount = useWatch({ control, name: 'amount' });
  const feeAmount = useWatch({ control, name: 'fee_amount' });
  const transferDate = useWatch({ control, name: 'transfer_date' });

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });

  useEffect(() => {
    reset(getDefaultValues(transfer, initialFromWalletId));
  }, [initialFromWalletId, reset, transfer]);

  const transferMutation = useMutation({
    mutationFn: async (values: TransferFormValues) => {
      const supabase = createClient();

      if (transfer?.id) {
        const { error } = await supabase.rpc('update_transfer_group_with_entries', {
          p_transfer_group_id: transfer.id,
          p_from_wallet_id: values.from_wallet_id,
          p_to_wallet_id: values.to_wallet_id,
          p_amount: values.amount,
          p_fee_amount: values.fee_amount,
          p_note: values.note?.trim() || null,
          p_transfer_date: values.transfer_date,
        });

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.rpc('create_transfer_group_with_entries', {
        p_from_wallet_id: values.from_wallet_id,
        p_to_wallet_id: values.to_wallet_id,
        p_amount: values.amount,
        p_fee_amount: values.fee_amount,
        p_note: values.note?.trim() || null,
        p_transfer_date: values.transfer_date,
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
      toast.success(t(transfer ? 'transfers.form.updateSuccess' : 'transfers.form.createSuccess'));
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, t(transfer ? 'transfers.form.updateError' : 'transfers.form.createError'))
      );
    },
  });

  const wallets = walletsQuery.data ?? [];
  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId);
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId);
  const totalDeducted = (amount || 0) + (feeAmount || 0);
  const formTitle = language === 'id' ? 'Detail transfer' : 'Transfer details';
  const essentialTitle = language === 'id' ? 'Utama' : 'Essential';
  const detailsTitle = language === 'id' ? 'Detail' : 'Details';
  const optionalTitle = language === 'id' ? 'Opsional' : 'Optional';
  const transferRouteLabel = fromWallet && toWallet ? `${fromWallet.name} -> ${toWallet.name}` : t('transfers.preview.pendingWallet');

  return (
    <form className="grid gap-4 rounded-[inherit] bg-surface-1 p-4 md:p-5" onSubmit={handleSubmit((values) => transferMutation.mutate(values))}>
      <div className="grid gap-1">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
          {transfer ? t('transfers.form.edit') : t('transfers.form.new')}
        </span>
        <h3 className="text-lg font-semibold tracking-[-0.03em]">{formTitle}</h3>
      </div>

      <div className="grid gap-3">
        <FormSectionHeader step="01" title={essentialTitle} />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="input-group">
            <label className="input-label" htmlFor="transfer-from-wallet">{t('transfers.form.fromWallet')}</label>
            <select id="transfer-from-wallet" className={compactSelectClassName} {...register('from_wallet_id')} disabled={walletsQuery.isLoading}>
              <option value="">{t('transfers.form.chooseWallet')}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.from_wallet_id ? t('transfers.form.walletRequired') : undefined} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="transfer-to-wallet">{t('transfers.form.toWallet')}</label>
            <select id="transfer-to-wallet" className={compactSelectClassName} {...register('to_wallet_id')} disabled={walletsQuery.isLoading}>
              <option value="">{t('transfers.form.chooseWallet')}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </select>
            <FieldError message={errors.to_wallet_id ? t('transfers.form.walletDifferent') : undefined} />
          </div>

          <div className="input-group md:col-span-2">
            <label className="input-label" htmlFor="transfer-amount">{t('transfers.form.amount')}</label>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <CurrencyInput
                  id="transfer-amount"
                  name={field.name}
                  placeholder="500000"
                  value={field.value}
                  onBlur={field.onBlur}
                  onNumberValueChange={field.onChange}
                  ref={field.ref}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                />
              )}
            />
            <FieldError message={errors.amount ? t('transfers.form.amountInvalid') : undefined} />
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <FormSectionHeader step="02" title={detailsTitle} />

        <div className="grid gap-3 md:grid-cols-2">
          <div className="input-group">
            <label className="input-label" htmlFor="transfer-date">{t('transfers.form.date')}</label>
            <Input id="transfer-date" type="date" className="min-h-[2.85rem] px-3.5 py-2.5" {...register('transfer_date')} />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="transfer-fee">{t('transfers.form.fee')}</label>
            <Controller
              control={control}
              name="fee_amount"
              render={({ field }) => (
                <CurrencyInput
                  id="transfer-fee"
                  name={field.name}
                  placeholder="0"
                  value={field.value}
                  onBlur={field.onBlur}
                  onNumberValueChange={field.onChange}
                  ref={field.ref}
                  className="min-h-[2.85rem] px-3.5 py-2.5"
                />
              )}
            />
            <FieldError message={errors.fee_amount ? t('transfers.form.feeInvalid') : undefined} />
          </div>
        </div>
      </div>

      <div className="grid gap-2.5">
        <FormSectionHeader step="03" title={optionalTitle} />

        <div className="input-group">
          <label className="input-label" htmlFor="transfer-note">{t('transfers.form.note')}</label>
          <Input
            id="transfer-note"
            type="text"
            className="min-h-[2.85rem] px-3.5 py-2.5"
            placeholder={t('transfers.form.notePlaceholder')}
            {...register('note')}
          />
        </div>
      </div>

      <Card className="border-border-subtle bg-surface-2/55 p-3 shadow-none">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-2">
          <SaveHint icon={<ArrowLeftRight size={15} />} value={transferRouteLabel} />
          <SaveHint icon={<Wallet2 size={15} />} value={formatCurrency(totalDeducted)} />
          <SaveHint icon={<CalendarDays size={15} />} value={transferDate || toDateInputValue()} />
        </div>
      </Card>

      <div className="grid gap-2.5 md:grid-cols-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" disabled={transferMutation.isPending}>
          {transferMutation.isPending ? t('common.loading') : t('common.save')}
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
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-3">{step}</span>
      <div className="grid gap-0.5">
        <strong className="text-sm font-semibold text-text-1">{title}</strong>
        {description ? <span className="text-sm text-text-3">{description}</span> : null}
      </div>
    </div>
  );
}

function SaveHint({
  icon,
  value,
}: {
  icon: ReactNode;
  value: ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-1 px-2.5 py-1">
      <span className="text-text-3">{icon}</span>
      <span className="font-medium text-text-1">{value}</span>
    </span>
  );
}
