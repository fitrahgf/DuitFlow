"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Wallet2,
} from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  FieldRow,
  FormActions,
  FormSection,
  SaveHints,
} from "@/components/forms/FormPatterns";
import {
  FormField,
  FormLabel,
  FormLegend,
  FormMetaChip,
} from "@/components/forms/FormPrimitives";
import { FieldError } from "@/components/shared/FieldError";
import { useLanguage } from "@/components/LanguageProvider";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/lib/date";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  TRANSACTIONS_CHANGED_EVENT,
} from "@/lib/events";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/queries/keys";
import { fetchActiveWallets, fetchCategories } from "@/lib/queries/reference";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  transactionFormSchema,
  type TransactionFormInput,
  type TransactionFormValues,
} from "@/lib/validators/transaction";

interface TransactionFormData {
  id: string;
  amount: number;
  type: "income" | "expense";
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
  type?: "income" | "expense";
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
  variant?: "dialog" | "sheet";
  createSource?: "manual" | "quick_add" | "wishlist_conversion";
  presentation?: "default" | "minimal";
}

function getDefaultValues(
  transaction?: TransactionFormData | null,
  defaultWalletId?: string | null,
  initialValues?: TransactionFormPrefill | null,
): TransactionFormInput {
  const baseValues = initialValues ?? {};
  const values: Partial<TransactionFormInput> = {
    type: transaction?.type ?? baseValues.type ?? "expense",
    title: transaction?.title ?? baseValues.title ?? transaction?.note ?? "",
    category_id: transaction?.category_id ?? baseValues.category_id ?? "",
    wallet_id:
      transaction?.wallet_id ?? baseValues.wallet_id ?? defaultWalletId ?? "",
    note: transaction?.note ?? baseValues.note ?? "",
    date:
      transaction?.transaction_date ??
      transaction?.date ??
      baseValues.date ??
      toDateInputValue(),
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
  variant = "dialog",
  createSource = "manual",
  presentation = "default",
}: TransactionFormProps) {
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const compactSheet = variant === "sheet";
  const minimalPresentation = presentation === "minimal";
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormInput, undefined, TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: getDefaultValues(
      transaction,
      defaultWalletId,
      initialValues,
    ),
  });

  const selectedType = useWatch({ control, name: "type" });
  const selectedWalletId = useWatch({ control, name: "wallet_id" });
  const selectedDate = useWatch({ control, name: "date" });
  const transactionType = selectedType ?? "expense";
  const formTitle =
    language === "id" ? "Detail transaksi" : "Transaction details";
  const essentialTitle = language === "id" ? "Utama" : "Essential";
  const detailsTitle = language === "id" ? "Detail" : "Details";
  const optionalTitle = language === "id" ? "Opsional" : "Optional";

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: queryKeys.categories.list(transactionType),
    queryFn: () => fetchCategories(transactionType),
  });

  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });
  const selectedWalletName =
    wallets.find((wallet) => wallet.id === selectedWalletId)?.name ||
    t("transactions.form.noWallets");
  const subtleLabelClassName =
    "text-[0.72rem] font-medium normal-case tracking-[-0.01em] text-text-2";
  const sectionClassName = cn(
    minimalPresentation && "gap-2 border-t border-border-subtle/70 pt-3 first:border-t-0 first:pt-0",
  );
  const sectionContentClassName = cn(minimalPresentation ? "gap-2" : "gap-2.5");

  useEffect(() => {
    reset(getDefaultValues(transaction, defaultWalletId, initialValues));
  }, [defaultWalletId, initialValues, reset, transaction]);

  useEffect(() => {
    if (!transaction?.wallet_id && !selectedWalletId && wallets.length > 0) {
      const fallbackWalletId = defaultWalletId ?? wallets[0].id;
      setValue("wallet_id", fallbackWalletId, {
        shouldDirty: false,
        shouldValidate: true,
      });
    }
  }, [
    defaultWalletId,
    selectedWalletId,
    setValue,
    transaction?.wallet_id,
    wallets,
  ]);

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
        const { error } = await supabase
          .from("transactions")
          .update(payload)
          .eq("id", transaction.id);
        if (error) {
          throw error;
        }
        return;
      }

      const { error } = await supabase.from("transactions").insert(payload);
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
      toast.success(t("transactions.form.saveSuccess"));
      onSuccess();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("transactions.form.saveError")));
    },
  });

  return (
    <form
      className={cn(
        "grid rounded-[inherit] bg-surface-1",
        compactSheet
          ? "gap-2.5 p-0"
          : minimalPresentation
            ? "gap-3 px-3 pb-3 pt-2.5 md:px-4 md:pb-4 md:pt-3"
            : "gap-3 p-3 md:p-4",
      )}
      onSubmit={handleSubmit((values) => transactionMutation.mutate(values))}
    >
      {!compactSheet && !minimalPresentation ? (
        <div className="grid gap-1">
          <span className="text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-text-3">
            {transaction
              ? t("transactions.form.edit")
              : t("transactions.form.new")}
          </span>
          <h3 className="text-[1.02rem] font-semibold tracking-[-0.04em] text-text-1">
            {formTitle}
          </h3>
        </div>
      ) : null}

      <FormSection
        step="01"
        title={essentialTitle}
        surface={minimalPresentation ? "plain" : "boxed"}
        headerTone={minimalPresentation ? "light" : "default"}
        stepVariant={minimalPresentation ? "inline" : "badge"}
        className={sectionClassName}
        contentClassName={sectionContentClassName}
      >
        <fieldset className="grid gap-1.5">
          <FormLegend className={minimalPresentation ? subtleLabelClassName : undefined}>
            {t("transactions.form.type")}
          </FormLegend>
          <div
            className={cn(
              "grid grid-cols-2 gap-1 rounded-[var(--radius-control)] p-1",
              minimalPresentation
                ? "bg-surface-2/55"
                : "border border-border-subtle bg-surface-1/88",
            )}
          >
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-0.06rem)] px-3 py-2 text-center transition-[background-color,color,box-shadow] duration-200",
                minimalPresentation ? "min-h-[2.45rem]" : "min-h-[2.7rem]",
                selectedType === "expense"
                  ? "bg-danger-soft text-danger shadow-xs"
                  : "text-text-2 hover:bg-surface-2/72 hover:text-text-1",
              )}
              onClick={() =>
                setValue("type", "expense", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <ArrowDownLeft size={15} />
              <span className="text-[0.8rem] font-semibold">
                {t("transactions.expense")}
              </span>
            </button>
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-0.06rem)] px-3 py-2 text-center transition-[background-color,color,box-shadow] duration-200",
                minimalPresentation ? "min-h-[2.45rem]" : "min-h-[2.7rem]",
                selectedType === "income"
                  ? "bg-accent-soft text-accent-strong shadow-xs"
                  : "text-text-2 hover:bg-surface-2/72 hover:text-text-1",
              )}
              onClick={() =>
                setValue("type", "income", {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            >
              <ArrowUpRight size={15} />
              <span className="text-[0.8rem] font-semibold">
                {t("transactions.income")}
              </span>
            </button>
          </div>
        </fieldset>

        <FieldRow className="gap-2.5">
          <FormField className="md:col-span-2">
            <FormLabel
              htmlFor="transaction-amount"
              className={minimalPresentation ? subtleLabelClassName : undefined}
            >
              {t("transactions.form.amount")}
            </FormLabel>
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
                  aria-invalid={errors.amount ? "true" : "false"}
                  className={cn(
                    "px-3.5",
                    minimalPresentation
                      ? "min-h-[3.15rem] py-2.5 text-[1rem] font-semibold tracking-[-0.03em]"
                      : "min-h-[2.8rem] py-2",
                  )}
                  required
                />
              )}
            />
            <FieldError
              message={
                errors.amount ? t("transactions.form.amountInvalid") : undefined
              }
            />
          </FormField>

          <FormField>
            <FormLabel
              htmlFor="transaction-title"
              className={minimalPresentation ? subtleLabelClassName : undefined}
            >
              {t("transactions.form.title")}
            </FormLabel>
            <Input
              id="transaction-title"
              type="text"
              aria-invalid={errors.title ? "true" : "false"}
              className={cn(
                minimalPresentation
                  ? "min-h-[2.7rem] px-3.5 py-2"
                  : "min-h-[2.8rem] px-3.5 py-2",
              )}
              placeholder={t("transactions.form.titlePlaceholder")}
              {...register("title")}
              required
            />
            <FieldError
              message={
                errors.title ? t("transactions.form.titleRequired") : undefined
              }
            />
          </FormField>

          <FormField>
            <FormLabel
              htmlFor="transaction-wallet"
              className={minimalPresentation ? subtleLabelClassName : undefined}
            >
              {t("transactions.form.wallet")}
            </FormLabel>
            <NativeSelect
              id="transaction-wallet"
              aria-invalid={errors.wallet_id ? "true" : "false"}
              {...register("wallet_id")}
              disabled={walletsLoading}
              required
            >
              {wallets.map((wallet) => (
                <option key={wallet.id} value={wallet.id}>
                  {wallet.name}
                </option>
              ))}
              {wallets.length === 0 ? (
                <option value="">{t("transactions.form.noWallets")}</option>
              ) : null}
            </NativeSelect>
            <FieldError
              message={
                errors.wallet_id
                  ? t("transactions.form.walletRequired")
                  : undefined
              }
            />
          </FormField>
        </FieldRow>
      </FormSection>

      <FormSection
        step="02"
        title={detailsTitle}
        surface={minimalPresentation ? "plain" : "boxed"}
        headerTone={minimalPresentation ? "light" : "default"}
        stepVariant={minimalPresentation ? "inline" : "badge"}
        className={sectionClassName}
        contentClassName={sectionContentClassName}
      >
        <FieldRow className="gap-2.5">
          <FormField>
            <FormLabel
              htmlFor="transaction-category"
              className={minimalPresentation ? subtleLabelClassName : undefined}
            >
              {t("transactions.form.category")}
            </FormLabel>
            <NativeSelect
              id="transaction-category"
              {...register("category_id")}
              disabled={categoriesLoading}
            >
              <option value="">{t("common.uncategorized")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>

          <FormField>
            <FormLabel
              htmlFor="transaction-date"
              className={minimalPresentation ? subtleLabelClassName : undefined}
            >
              {t("transactions.form.date")}
            </FormLabel>
            <Input
              id="transaction-date"
              type="date"
              className={cn(
                minimalPresentation
                  ? "min-h-[2.7rem] px-3.5 py-2"
                  : "min-h-[2.8rem] px-3.5 py-2",
              )}
              {...register("date")}
              required
            />
          </FormField>
        </FieldRow>
      </FormSection>

      <FormSection
        step="03"
        title={optionalTitle}
        surface={minimalPresentation ? "plain" : "boxed"}
        headerTone={minimalPresentation ? "light" : "default"}
        stepVariant={minimalPresentation ? "inline" : "badge"}
        className={cn(sectionClassName, "gap-2.5")}
        contentClassName={sectionContentClassName}
      >
        <FormField>
          <FormLabel
            htmlFor="transaction-note"
            className={minimalPresentation ? subtleLabelClassName : undefined}
          >
            {t("transactions.form.note")}
          </FormLabel>
          <Textarea
            id="transaction-note"
            aria-invalid={errors.note ? "true" : "false"}
            className={cn(
              minimalPresentation
                ? "min-h-[4rem] px-3.5 py-2"
                : "min-h-[4.5rem] px-3.5 py-2.5",
            )}
            placeholder={t("transactions.form.notePlaceholder")}
            {...register("note")}
          />
        </FormField>
      </FormSection>

      <SaveHints
        variant={minimalPresentation ? "inline" : "card"}
        className={cn(compactSheet && "p-2.5", minimalPresentation && "gap-1.25")}
      >
        <FormMetaChip
          icon={<Wallet2 size={14} />}
          value={selectedWalletName}
          variant={minimalPresentation ? "subtle" : "default"}
        />
        <FormMetaChip
          icon={<CalendarDays size={14} />}
          value={selectedDate || toDateInputValue()}
          variant={minimalPresentation ? "subtle" : "default"}
        />
      </SaveHints>

      <FormActions
        sticky={compactSheet}
        className={cn(
          "sm:grid-cols-2",
          minimalPresentation && !compactSheet && "border-t border-border-subtle/75 pt-3",
          !compactSheet && "md:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]",
        )}
      >
        <Button
          type="button"
          variant="secondary"
          className="shadow-none"
          onClick={onCancel}
        >
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="shadow-xs"
          disabled={transactionMutation.isPending}
        >
          {transactionMutation.isPending
            ? t("categories.form.saving")
            : t("common.save")}
        </Button>
      </FormActions>
    </form>
  );
}
