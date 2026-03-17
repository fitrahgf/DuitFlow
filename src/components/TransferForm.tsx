"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, CalendarDays, Wallet2 } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import {
  FieldRow,
  FormActions,
  FormSection,
  SaveHints,
} from "@/components/forms/FormPatterns";
import {
  FormField,
  FormLabel,
  FormMetaChip,
} from "@/components/forms/FormPrimitives";
import { FieldError } from "@/components/shared/FieldError";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { toDateInputValue } from "@/lib/date";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  TRANSACTIONS_CHANGED_EVENT,
} from "@/lib/events";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queries/keys";
import { fetchActiveWallets } from "@/lib/queries/reference";
import type { TransferListItem } from "@/lib/queries/transfers";
import { createClient } from "@/lib/supabase/client";
import {
  transferFormSchema,
  type TransferFormInput,
  type TransferFormValues,
} from "@/lib/validators/transfer";

interface TransferFormProps {
  transfer?: TransferListItem | null;
  initialFromWalletId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function getDefaultValues(
  transfer?: TransferListItem | null,
  initialFromWalletId?: string | null,
): TransferFormInput {
  const values: Partial<TransferFormInput> = {
    from_wallet_id: transfer?.from_wallet_id ?? initialFromWalletId ?? "",
    to_wallet_id: transfer?.to_wallet_id ?? "",
    fee_amount: transfer?.fee_amount ?? 0,
    note: transfer?.note ?? "",
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

  const fromWalletId = useWatch({ control, name: "from_wallet_id" });
  const toWalletId = useWatch({ control, name: "to_wallet_id" });
  const amount = useWatch({ control, name: "amount" });
  const feeAmount = useWatch({ control, name: "fee_amount" });
  const transferDate = useWatch({ control, name: "transfer_date" });

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
        const { error } = await supabase.rpc(
          "update_transfer_group_with_entries",
          {
            p_transfer_group_id: transfer.id,
            p_from_wallet_id: values.from_wallet_id,
            p_to_wallet_id: values.to_wallet_id,
            p_amount: values.amount,
            p_fee_amount: values.fee_amount,
            p_note: values.note?.trim() || null,
            p_transfer_date: values.transfer_date,
          },
        );

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await supabase.rpc(
        "create_transfer_group_with_entries",
        {
          p_from_wallet_id: values.from_wallet_id,
          p_to_wallet_id: values.to_wallet_id,
          p_amount: values.amount,
          p_fee_amount: values.fee_amount,
          p_note: values.note?.trim() || null,
          p_transfer_date: values.transfer_date,
        },
      );

      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transfers.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview,
        }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(
        t(
          transfer
            ? "transfers.form.updateSuccess"
            : "transfers.form.createSuccess",
        ),
      );
      onSuccess();
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(
          error,
          t(
            transfer
              ? "transfers.form.updateError"
              : "transfers.form.createError",
          ),
        ),
      );
    },
  });

  const wallets = walletsQuery.data ?? [];
  const fromWallet = wallets.find((wallet) => wallet.id === fromWalletId);
  const toWallet = wallets.find((wallet) => wallet.id === toWalletId);
  const totalDeducted = (amount || 0) + (feeAmount || 0);
  const formTitle = language === "id" ? "Detail transfer" : "Transfer details";
  const essentialTitle = language === "id" ? "Utama" : "Essential";
  const detailsTitle = language === "id" ? "Detail" : "Details";
  const optionalTitle = language === "id" ? "Opsional" : "Optional";
  const transferRouteLabel =
    fromWallet && toWallet
      ? `${fromWallet.name} -> ${toWallet.name}`
      : t("transfers.preview.pendingWallet");

  return (
    <form
      className="grid gap-4 rounded-[inherit] bg-surface-1 p-4 md:p-5"
      onSubmit={handleSubmit((values) => transferMutation.mutate(values))}
    >
      <div className="grid gap-1">
        <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
          {transfer ? t("transfers.form.edit") : t("transfers.form.new")}
        </span>
        <h3 className="text-lg font-semibold tracking-[-0.03em]">
          {formTitle}
        </h3>
      </div>

      <FormSection step="01" title={essentialTitle} contentClassName="gap-3">
        <FieldRow>
          <FormField>
            <FormLabel htmlFor="transfer-from-wallet">
              {t("transfers.form.fromWallet")}
            </FormLabel>
            <NativeSelect
              id="transfer-from-wallet"
              {...register("from_wallet_id")}
              disabled={walletsQuery.isLoading}
            >
              <option value="">{t("transfers.form.chooseWallet")}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError
              message={
                errors.from_wallet_id
                  ? t("transfers.form.walletRequired")
                  : undefined
              }
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="transfer-to-wallet">
              {t("transfers.form.toWallet")}
            </FormLabel>
            <NativeSelect
              id="transfer-to-wallet"
              {...register("to_wallet_id")}
              disabled={walletsQuery.isLoading}
            >
              <option value="">{t("transfers.form.chooseWallet")}</option>
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
            </NativeSelect>
            <FieldError
              message={
                errors.to_wallet_id
                  ? t("transfers.form.walletDifferent")
                  : undefined
              }
            />
          </FormField>

          <FormField className="md:col-span-2">
            <FormLabel htmlFor="transfer-amount">
              {t("transfers.form.amount")}
            </FormLabel>
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
            <FieldError
              message={
                errors.amount ? t("transfers.form.amountInvalid") : undefined
              }
            />
          </FormField>
        </FieldRow>
      </FormSection>

      <FormSection step="02" title={detailsTitle} contentClassName="gap-3">
        <FieldRow>
          <FormField>
            <FormLabel htmlFor="transfer-date">
              {t("transfers.form.date")}
            </FormLabel>
            <Input
              id="transfer-date"
              type="date"
              className="min-h-[2.85rem] px-3.5 py-2.5"
              {...register("transfer_date")}
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="transfer-fee">
              {t("transfers.form.fee")}
            </FormLabel>
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
            <FieldError
              message={
                errors.fee_amount ? t("transfers.form.feeInvalid") : undefined
              }
            />
          </FormField>
        </FieldRow>
      </FormSection>

      <FormSection step="03" title={optionalTitle} className="gap-2.5">
        <FormField>
          <FormLabel htmlFor="transfer-note">
            {t("transfers.form.note")}
          </FormLabel>
          <Input
            id="transfer-note"
            type="text"
            className="min-h-[2.85rem] px-3.5 py-2.5"
            placeholder={t("transfers.form.notePlaceholder")}
            {...register("note")}
          />
        </FormField>
      </FormSection>

      <SaveHints>
        <FormMetaChip
          icon={<ArrowLeftRight size={15} />}
          value={transferRouteLabel}
        />
        <FormMetaChip
          icon={<Wallet2 size={15} />}
          value={formatCurrency(totalDeducted)}
        />
        <FormMetaChip
          icon={<CalendarDays size={15} />}
          value={transferDate || toDateInputValue()}
        />
      </SaveHints>

      <FormActions className="md:grid-cols-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={transferMutation.isPending}
        >
          {transferMutation.isPending ? t("common.loading") : t("common.save")}
        </Button>
      </FormActions>
    </form>
  );
}
