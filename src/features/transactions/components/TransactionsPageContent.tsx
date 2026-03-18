"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Download } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import { useLanguage } from "@/components/LanguageProvider";
import {
  EmptyStateCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
} from "@/components/shared/PagePrimitives";
import { Button } from "@/components/ui/button";
import {
  TransactionEditorDialog,
  TransactionsAdvancedFiltersDialog,
  TransactionsFiltersSection,
  TransactionsInsightsLayout,
  TransactionsInsightsSection,
  TransactionsResultsSection,
} from "@/features/transactions/components/TransactionsSections";
import {
  FILTER_CHIP_PREVIEW_COUNT,
  buildTransactionSearchSummary,
  getTransactionLatestLabel,
  getTransactionPeriodLabel,
  getTransactionSourceLabel,
  isTransactionFilterStateDirty,
  matchesTransactionCoreFilters,
  matchesTransactionPeriod,
  sortTransactions,
} from "@/features/transactions/lib/transactionsPresentation";
import {
  NOTIFICATIONS_REFRESH_EVENT,
  TRANSACTIONS_CHANGED_EVENT,
} from "@/lib/events";
import { getErrorMessage } from "@/lib/errors";
import {
  buildTransactionCsvContent,
  buildTransactionCsvRows,
  downloadCsvFile,
} from "@/lib/export/csv";
import { queryKeys } from "@/lib/queries/keys";
import {
  buildTransactionDisplayItems,
} from "@/lib/transactionFeed";
import { fetchActiveWallets, fetchCategories } from "@/lib/queries/reference";
import {
  defaultTransactionFilters,
  fetchTransactions,
  type TransactionFilters,
  type TransactionListItem,
} from "@/lib/queries/transactions";
import { createClient } from "@/lib/supabase/client";
import {
  parseTransactionUrlState,
  serializeTransactionUrlState,
  transactionFiltersToUrlState,
  transactionUrlStateToFilters,
} from "@/lib/url-state";

export function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { t, language } = useLanguage();
  const { currencyCode, formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionListItem | null>(null);
  const filters = transactionUrlStateToFilters(
    parseTransactionUrlState(searchParams),
  );
  const [draftFilters, setDraftFilters] = useState<TransactionFilters>(
    () => filters,
  );

  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions.list("all-records"),
    queryFn: fetchTransactions,
  });
  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.active,
    queryFn: fetchActiveWallets,
  });
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.options("all"),
    queryFn: () => fetchCategories(),
  });

  useEffect(() => {
    const handleTransactionsChanged = () =>
      void queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.all,
      });

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

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("transactions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

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
      toast.success(t("transactions.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("transactions.deleteError")));
    },
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (transferGroupId: string) => {
      const supabase = createClient();
      const { error } = await supabase.rpc("soft_delete_transfer_group", {
        p_transfer_group_id: transferGroupId,
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
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.overview,
        }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t("transfers.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("transfers.deleteError")));
    },
  });

  const handleDelete = async (id: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      description: t("transactions.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    deleteTransactionMutation.mutate(id);
  };

  const handleDeleteTransfer = async (transferGroupId: string) => {
    const accepted = await confirm({
      title: t("common.delete"),
      description: t("transfers.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    deleteTransferMutation.mutate(transferGroupId);
  };

  const handleEdit = (transaction: TransactionListItem) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const replaceTransactionState = (nextFilters: TransactionFilters) => {
    const nextQueryString = serializeTransactionUrlState(
      transactionFiltersToUrlState(nextFilters),
    );
    const currentQueryString = searchParamsKey;

    if (nextQueryString === currentQueryString) {
      return;
    }

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname, {
      scroll: false,
    });
  };

  const handleResetAll = () => {
    setDraftFilters(defaultTransactionFilters);
    replaceTransactionState(defaultTransactionFilters);
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
      day: "numeric",
      month: "short",
    });

  const transactions = transactionsQuery.data ?? [];
  const displayTransactions = buildTransactionDisplayItems(transactions);
  const baseFilteredTransactions = displayTransactions.filter((transaction) =>
    matchesTransactionCoreFilters(transaction, filters),
  );
  const filteredTransactions = sortTransactions(
    baseFilteredTransactions.filter((transaction) =>
      matchesTransactionPeriod(transaction, filters),
    ),
    filters.sort,
  );

  const hasActiveFilters =
    Boolean(filters.search) || isTransactionFilterStateDirty(filters);
  const searchSummary = buildTransactionSearchSummary(
    baseFilteredTransactions,
    filters,
    filteredTransactions,
  );

  const activeFilterChips = [
    filters.search ? `${t("transactions.search")}: ${filters.search}` : null,
    filters.type !== "all" ? t(`transactions.${filters.type}`) : null,
    filters.period !== "all" ? getTransactionPeriodLabel(filters.period, t) : null,
    filters.walletId
      ? (walletsQuery.data?.find((wallet) => wallet.id === filters.walletId)
          ?.name ?? null)
      : null,
    filters.categoryId
      ? (categoriesQuery.data?.find(
          (category) => category.id === filters.categoryId,
        )?.name ?? null)
      : null,
    filters.source !== "all"
      ? getTransactionSourceLabel(filters.source, t)
      : null,
    filters.minAmount
      ? `${t("transactions.minAmount")} ${formatCurrency(Number(filters.minAmount))}`
      : null,
    filters.maxAmount
      ? `${t("transactions.maxAmount")} ${formatCurrency(Number(filters.maxAmount))}`
      : null,
    filters.sort !== "newest" ? t(`transactions.sort.${filters.sort}`) : null,
  ].filter(Boolean) as string[];
  const visibleFilterChips = activeFilterChips.slice(
    0,
    FILTER_CHIP_PREVIEW_COUNT,
  );
  const hiddenChipCount = Math.max(
    0,
    activeFilterChips.length - visibleFilterChips.length,
  );

  const handleExportCsv = () => {
    if (filteredTransactions.length === 0) {
      toast.error(t("transactions.exportEmpty"));
      return;
    }

    try {
      const csvRows = buildTransactionCsvRows(filteredTransactions, currencyCode);
      const csvContent = buildTransactionCsvContent(csvRows);
      const dateStamp = new Date().toISOString().split("T")[0];
      downloadCsvFile(`duitflow-transactions-${dateStamp}.csv`, csvContent);
    } catch (error) {
      toast.error(getErrorMessage(error, t("transactions.exportError")));
    }
  };

  return (
    <PageShell className="animate-fade-in">
      <PageHeader variant="compact">
        <PageHeading
          title={t("transactions.title")}
          compact
        />
        <PageHeaderActions>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={handleExportCsv}
            disabled={
              transactionsQuery.isLoading || filteredTransactions.length === 0
            }
          >
            <Download size={16} />
            <span className="sm:hidden">CSV</span>
            <span className="hidden sm:inline">
              {t("transactions.exportCsv")}
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => router.push("/transfer")}
          >
            <ArrowLeftRight size={16} />
            {t("transfers.addTransfer")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              setEditingTransaction(null);
              setIsFormOpen(true);
            }}
          >
            {t("transactions.addTransaction")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <TransactionsInsightsLayout hasActiveFilters={hasActiveFilters}>
        <TransactionsFiltersSection
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          activeFilterChips={activeFilterChips}
          visibleFilterChips={visibleFilterChips}
          hiddenChipCount={hiddenChipCount}
          language={language}
          t={t}
          onReplaceFilters={replaceTransactionState}
          onOpenAdvancedFilters={() => {
            setDraftFilters(filters);
            setIsFilterOpen(true);
          }}
          onResetAll={handleResetAll}
          getPeriodLabel={getTransactionPeriodLabel}
        />
        <TransactionsInsightsSection
          hasActiveFilters={hasActiveFilters}
          searchSummary={searchSummary}
          t={t}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getDisplayLatestLabel={getTransactionLatestLabel}
        />
      </TransactionsInsightsLayout>

      <TransactionEditorDialog
        open={isFormOpen}
        editingTransaction={editingTransaction}
        t={t}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingTransaction(null);
          }
        }}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onCancel={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
      />

      <TransactionsAdvancedFiltersDialog
        open={isFilterOpen}
        filters={filters}
        draftFilters={draftFilters}
        wallets={walletsQuery.data ?? []}
        categories={categoriesQuery.data ?? []}
        t={t}
        onOpenChange={(open) => {
          if (open) {
            setDraftFilters(filters);
          }
          setIsFilterOpen(open);
        }}
        setDraftFilters={setDraftFilters}
        onApply={() => {
          replaceTransactionState({
            ...draftFilters,
            search: filters.search,
          });
          setIsFilterOpen(false);
        }}
      />

      <TransactionsResultsSection
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        displayTransactions={displayTransactions}
        filteredTransactions={filteredTransactions}
        t={t}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDeleteTransfer={handleDeleteTransfer}
        onEditTransfer={(transferGroupId) =>
          router.push(`/transfer?edit=${transferGroupId}`)
        }
        deleteTransactionPending={deleteTransactionMutation.isPending}
        deleteTransferPending={deleteTransferMutation.isPending}
      />
    </PageShell>
  );
}

export function TransactionsPageFallback() {
  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title="Transactions" />
      </PageHeader>
      <EmptyStateCard title="Loading..." compact variant="inline" role="embedded" />
    </PageShell>
  );
}
