"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  Landmark,
  MoreHorizontal,
  Pencil,
  Smartphone,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/ConfirmDialogProvider";
import { useCurrencyPreferences } from "@/components/CurrencyPreferencesProvider";
import {
  FieldRow,
  FormActions,
  FormSection,
} from "@/components/forms/FormPatterns";
import {
  FormField,
  FormHint,
  FormLabel,
  FormLegend,
} from "@/components/forms/FormPrimitives";
import TransactionForm from "@/components/TransactionForm";
import { useLanguage } from "@/components/LanguageProvider";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from "@/components/shared/PagePrimitives";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TRANSACTIONS_CHANGED_EVENT } from "@/lib/events";
import { getErrorMessage } from "@/lib/errors";
import { getCategoryIcon } from "@/lib/icons";
import { queryKeys } from "@/lib/queries/keys";
import {
  fetchWalletDetail,
  fetchWallets,
  type WalletDetail,
  type WalletListItem,
} from "@/lib/queries/wallets";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { walletFormSchema } from "@/lib/validators/wallet";

type WalletType = WalletListItem["type"];
type WalletView = "active" | "archived";

const typeOptions: { value: WalletType; labelKey: string; icon: LucideIcon }[] =
  [
    { value: "cash", labelKey: "wallets.types.cash", icon: Coins },
    { value: "bank", labelKey: "wallets.types.bank", icon: Landmark },
    { value: "e-wallet", labelKey: "wallets.types.e-wallet", icon: Smartphone },
    { value: "other", labelKey: "wallets.types.other", icon: Wallet },
  ];

function WalletMetaDot() {
  return <span className="h-1 w-1 rounded-full bg-border-strong/80" aria-hidden="true" />;
}

export default function WalletsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const [view, setView] = useState<WalletView>("active");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletListItem | null>(
    null,
  );
  const [detailWalletId, setDetailWalletId] = useState<string | null>(null);
  const [transactionWalletId, setTransactionWalletId] = useState<string | null>(
    null,
  );
  const [name, setName] = useState("");
  const [type, setType] = useState<WalletType>("cash");
  const [balance, setBalance] = useState("0");
  const [color, setColor] = useState("#16a34a");
  const [icon, setIcon] = useState("cash");
  const [supabase] = useState(() => createClient());
  const walletFormTitle = editingWallet
    ? t("wallets.form.edit")
    : t("wallets.form.new");
  const walletEssentialTitle = language === "id" ? "Utama" : "Essential";
  const walletAppearanceTitle = language === "id" ? "Tampilan" : "Appearance";
  const selectedTypeOption =
    typeOptions.find((option) => option.value === type) ?? typeOptions[0];
  const SelectedTypeIcon = selectedTypeOption.icon;

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.list(view),
    queryFn: () => fetchWallets(view),
  });

  const walletDetailQuery = useQuery({
    queryKey: queryKeys.wallets.detail(detailWalletId ?? ""),
    queryFn: () => fetchWalletDetail(detailWalletId!),
    enabled: Boolean(detailWalletId),
  });

  useEffect(() => {
    const handleTransactionsChanged = () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
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

  const saveWalletMutation = useMutation({
    mutationFn: async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(t("auth.login.error"));
      }

      const parsed = walletFormSchema.safeParse({
        name,
        type,
        initialBalance: parseInt(balance, 10) || 0,
        color,
        icon,
      });

      if (!parsed.success) {
        throw new Error(t("wallets.form.saveError"));
      }

      const walletData = {
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color,
        icon: parsed.data.icon,
      };

      if (editingWallet) {
        const { error } = await supabase
          .from("wallets")
          .update(walletData)
          .eq("id", editingWallet.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("wallets").insert({
        user_id: user.id,
        ...walletData,
        initial_balance: parsed.data.initialBalance,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setEditingWallet(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      toast.success(t("wallets.form.saveSuccess"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("wallets.form.saveError")));
    },
  });

  const archiveWalletMutation = useMutation({
    mutationFn: async ({
      walletId,
      archive,
    }: {
      walletId: string;
      archive: boolean;
    }) => {
      const { error } = await supabase
        .from("wallets")
        .update({
          is_archived: archive,
          is_active: !archive,
        })
        .eq("id", walletId);

      if (error) {
        throw error;
      }
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      if (detailWalletId === variables.walletId) {
        setDetailWalletId(null);
      }
      toast.success(
        variables.archive
          ? t("wallets.archiveSuccess")
          : t("wallets.restoreSuccess"),
      );
    },
    onError: (error, variables) => {
      toast.error(
        getErrorMessage(
          error,
          variables.archive
            ? t("wallets.archiveError")
            : t("wallets.restoreError"),
        ),
      );
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", walletId);
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      if (detailWalletId) {
        setDetailWalletId(null);
      }
      toast.success(t("wallets.deleteSuccess"));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t("wallets.deleteError")));
    },
  });

  const handleOpenForm = (wallet: WalletListItem | null = null) => {
    if (wallet) {
      setEditingWallet(wallet);
      setName(wallet.name);
      setType(wallet.type);
      setBalance(String(wallet.initial_balance ?? wallet.balance));
      setColor(wallet.color || "#16a34a");
      setIcon(wallet.icon || wallet.type);
    } else {
      setEditingWallet(null);
      setName("");
      setType("cash");
      setBalance("0");
      setColor("#16a34a");
      setIcon("cash");
    }

    setIsFormOpen(true);
  };

  const openTransactionFormForWallet = (walletId: string) => {
    setTransactionWalletId(walletId);
    setIsTransactionFormOpen(true);
  };

  const openTransferFormForWallet = (walletId: string) => {
    router.push(`/transfer?from=${walletId}`);
  };

  const formatDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString(
          language === "id" ? "id-ID" : "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        )
      : t("wallets.noActivity");

  const formatCardDate = (date: string | null) =>
    date
      ? new Date(date).toLocaleDateString(
          language === "id" ? "id-ID" : "en-US",
          {
            month: "short",
            day: "numeric",
          },
        )
      : t("wallets.noActivity");

  const getWalletIcon = (walletType: WalletType) => {
    switch (walletType) {
      case "bank":
        return <Landmark size={22} />;
      case "e-wallet":
        return <Smartphone size={22} />;
      case "cash":
        return <Coins size={22} />;
      default:
        return <Wallet size={22} />;
    }
  };

  const handleArchiveToggle = async (wallet: WalletListItem) => {
    const nextArchiveState = !wallet.is_archived;
    const accepted = await confirm({
      title: nextArchiveState
        ? t("wallets.actions.archive")
        : t("wallets.actions.restore"),
      description: nextArchiveState
        ? t("wallets.confirmArchive")
        : t("wallets.confirmRestore"),
      confirmLabel: nextArchiveState
        ? t("wallets.actions.archive")
        : t("wallets.actions.restore"),
      cancelLabel: t("common.cancel"),
    });

    if (!accepted) {
      return;
    }

    archiveWalletMutation.mutate({
      walletId: wallet.id,
      archive: nextArchiveState,
    });
  };

  const handleDelete = async (wallet: WalletListItem) => {
    if (wallet.transaction_count > 0) {
      toast.error(t("wallets.deleteBlocked"));
      return;
    }

    const accepted = await confirm({
      title: t("common.delete"),
      description: t("wallets.confirmDelete"),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      tone: "danger",
    });

    if (!accepted) {
      return;
    }

    deleteWalletMutation.mutate(wallet.id);
  };

  const walletDetail = walletDetailQuery.data;
  const wallets = walletsQuery.data ?? [];
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const activeWalletCount = wallets.filter((wallet) => !wallet.is_archived).length;
  const totalTransactions = wallets.reduce(
    (sum, wallet) => sum + wallet.transaction_count,
    0,
  );
  const featuredWallet =
    wallets.length > 0
      ? [...wallets].sort((left, right) => right.balance - left.balance)[0]
      : null;

  return (
    <PageShell className="animate-fade-in">
      <PageHeader variant="compact">
        <PageHeading title={t("wallets.title")} compact />
        <PageHeaderActions>
          <Button
            type="button"
            variant="primary"
            className="max-sm:hidden"
            onClick={() => handleOpenForm()}
          >
            {t("wallets.addWallet")}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] xl:items-start">
        <SurfaceCard
          role="featured"
          padding="compact"
          className="grid gap-3 border-border-strong/24 bg-[linear-gradient(160deg,color-mix(in_srgb,var(--surface-1)_93%,transparent),color-mix(in_srgb,var(--surface-accent)_58%,transparent))]"
        >
          <div className="grid gap-1.5">
            <span className="text-[var(--font-size-chip)] font-medium tracking-[0.02em] text-text-2">
              {view === "archived"
                ? language === "id"
                  ? "Arsip dompet"
                  : "Archived wallets"
                : language === "id"
                  ? "Nilai tersimpan"
                  : "Stored value"}
            </span>
            <strong className="text-[var(--number-hero-size)] font-semibold leading-none tracking-[-0.09em] text-text-1">
              {formatCurrency(totalBalance)}
            </strong>
          </div>

          <div className="grid gap-2 border-t border-border-subtle/40 pt-3 sm:grid-cols-3">
            <WalletInlineStat
              label={language === "id" ? "Dompet aktif" : "Active wallets"}
              value={String(activeWalletCount)}
            />
            <WalletInlineStat
              label={language === "id" ? "Total aktivitas" : "Total activity"}
              value={String(totalTransactions)}
            />
            <WalletInlineStat
              label={language === "id" ? "Dompet utama" : "Primary wallet"}
              value={featuredWallet?.name ?? "-"}
            />
          </div>
        </SurfaceCard>

        <SurfaceCard role="embedded" padding="compact" className="grid gap-2.5">
          <div className="flex items-center justify-between gap-2 rounded-[calc(var(--radius-control)+0.12rem)] border border-border-subtle/70 bg-surface-1/78 p-1.5">
            <div className="flex min-w-0 items-center gap-1">
              {(["active", "archived"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={cn(
                    "min-w-max rounded-[calc(var(--radius-control)-0.04rem)] px-3 py-1.5 text-[var(--font-size-meta)] font-semibold transition",
                    view === value
                      ? "bg-accent-soft/88 text-text-1 ring-1 ring-accent/24"
                      : "text-text-2 hover:bg-surface-2/88 hover:text-text-1",
                  )}
                  onClick={() => setView(value)}
                >
                  {t(`wallets.tabs.${value}`)}
                </button>
              ))}
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="shrink-0"
              onClick={() => handleOpenForm()}
            >
              {t("wallets.addWallet")}
            </Button>
          </div>
          <span className="text-[var(--font-size-meta)] text-text-2">
            {view === "active"
              ? language === "id"
                ? "Menampilkan dompet aktif sebagai kartu debit utama."
                : "Showing active wallets in the primary debit-card view."
              : language === "id"
                ? "Menampilkan dompet arsip dalam format yang sama untuk konsistensi."
                : "Showing archived wallets in the same format for consistency."}
          </span>
        </SurfaceCard>
      </section>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingWallet(null);
          }
        }}
      >
        <DialogContent className="max-w-[32rem]">
          <DialogHeader>
            <DialogTitle>{walletFormTitle}</DialogTitle>
          </DialogHeader>

          <form
            className="grid gap-4 pt-2"
            onSubmit={(event) => {
              event.preventDefault();
              saveWalletMutation.mutate();
            }}
          >
            <FormSection
              step="01"
              title={walletEssentialTitle}
              contentClassName="gap-3"
            >
              <FieldRow>
                <FormField className="md:col-span-2">
                  <FormLabel htmlFor="wallet-name">
                    {t("wallets.form.name")}
                  </FormLabel>
                  <Input
                    id="wallet-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="BCA, Dana, Main Wallet"
                    className="min-h-[var(--control-height)] px-3.5"
                    required
                  />
                </FormField>

                <FormField>
                  <FormLabel htmlFor="wallet-balance">
                    {t("wallets.form.balance")}
                  </FormLabel>
                  <CurrencyInput
                    id="wallet-balance"
                    value={balance}
                    onValueChange={setBalance}
                    disabled={Boolean(editingWallet)}
                    className="min-h-[var(--control-height)] px-3.5"
                    required
                  />
                  {editingWallet ? (
                    <FormHint>{t("wallets.form.balanceManagedHint")}</FormHint>
                  ) : null}
                </FormField>

                <FormField>
                  <FormLabel htmlFor="wallet-color">
                    {t("wallets.form.color")}
                  </FormLabel>
                  <Input
                    id="wallet-color"
                    type="color"
                    className="h-[var(--control-height)] p-1.5"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  />
                </FormField>
              </FieldRow>

              <fieldset className="grid gap-2">
                <FormLegend>{t("wallets.form.type")}</FormLegend>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={type === option.value ? "primary" : "secondary"}
                      className="min-h-[var(--control-height)] justify-start rounded-[calc(var(--radius-card)-0.18rem)] px-3.5"
                      onClick={() => {
                        setType(option.value);
                        setIcon(option.value);
                      }}
                    >
                      <option.icon size={18} />
                      {t(option.labelKey)}
                    </Button>
                  ))}
                </div>
              </fieldset>
            </FormSection>

            <FormSection
              step="02"
              title={walletAppearanceTitle}
              contentClassName="gap-3"
            >
              <Card className="border-border-subtle bg-surface-2/55 p-3 shadow-none">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.06rem)]"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <SelectedTypeIcon size={20} />
                  </div>
                  <div className="grid gap-0.5">
                    <strong className="text-sm font-semibold text-text-1">
                      {name.trim() || t("wallets.form.new")}
                    </strong>
                    <span className="text-sm text-text-3">
                      {t(selectedTypeOption.labelKey)}
                    </span>
                  </div>
                </div>
              </Card>
            </FormSection>

            <FormActions className="pt-1 sm:grid-cols-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsFormOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={saveWalletMutation.isPending}
              >
                {saveWalletMutation.isPending
                  ? t("common.loading")
                  : t("common.save")}
              </Button>
            </FormActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
      >
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{t("transactions.form.new")}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            defaultWalletId={transactionWalletId}
            onSuccess={() => setIsTransactionFormOpen(false)}
            onCancel={() => setIsTransactionFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(detailWalletId)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailWalletId(null);
          }
        }}
      >
        <DialogContent className="max-w-[56rem]">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {walletDetail?.wallet.name ?? t("nav.wallets")}
            </DialogTitle>
          </DialogHeader>
          {walletDetailQuery.isLoading ? (
            <EmptyState title={t("common.loading")} compact />
          ) : walletDetailQuery.isError || !walletDetail ? (
            <EmptyState title={t("wallets.detail.loadError")} compact />
          ) : (
            <WalletDetailContent
              detail={walletDetail}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getWalletIcon={getWalletIcon}
              t={t}
              onEdit={() => {
                handleOpenForm(walletDetail.wallet);
                setDetailWalletId(null);
              }}
              onAddTransaction={() => {
                setDetailWalletId(null);
                openTransactionFormForWallet(walletDetail.wallet.id);
              }}
              onTransfer={() => {
                setDetailWalletId(null);
                openTransferFormForWallet(walletDetail.wallet.id);
              }}
              onArchiveToggle={() => {
                void handleArchiveToggle(walletDetail.wallet);
              }}
              onDelete={() => {
                void handleDelete(walletDetail.wallet);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {walletsQuery.isLoading ? (
        <SurfaceCard role="embedded" padding="compact">
          <EmptyState title={t("common.loading")} compact variant="inline" />
        </SurfaceCard>
      ) : walletsQuery.isError ? (
        <SurfaceCard role="embedded" padding="compact">
          <EmptyState title={t("wallets.loadError")} compact variant="inline" />
        </SurfaceCard>
      ) : wallets.length === 0 ? (
        <SurfaceCard role="embedded" padding="compact">
          <EmptyState
            title={
              view === "active"
                ? t("wallets.noWallets")
                : t("wallets.noArchivedWallets")
            }
            compact
            icon={<Wallet size={18} />}
            variant="featured"
          />
        </SurfaceCard>
      ) : (
        <section className="grid gap-3.5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-12">
            {wallets.map((wallet) => {
              const isFeatured = featuredWallet?.id === wallet.id;

              return (
                <WalletDebitCard
                  key={wallet.id}
                  wallet={wallet}
                  isFeatured={isFeatured}
                  language={language}
                  t={t}
                  formatCurrency={formatCurrency}
                  formatCardDate={formatCardDate}
                  getWalletIcon={getWalletIcon}
                  onOpenDetail={() => setDetailWalletId(wallet.id)}
                  onOpenForm={() => handleOpenForm(wallet)}
                  onOpenTransactionForm={() => openTransactionFormForWallet(wallet.id)}
                  onOpenTransferForm={() => openTransferFormForWallet(wallet.id)}
                  onArchiveToggle={() => {
                    void handleArchiveToggle(wallet);
                  }}
                  onDelete={() => {
                    void handleDelete(wallet);
                  }}
                />
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function selectedTypeLabelKey(type: WalletType) {
  return typeOptions.find((option) => option.value === type)?.labelKey ?? "wallets.types.other";
}

function WalletInlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <span className="text-[var(--font-size-meta)] font-medium tracking-[0.01em] text-text-2">
        {label}
      </span>
      <strong className="text-[0.94rem] font-semibold tracking-[-0.03em] text-text-1">
        {value}
      </strong>
    </div>
  );
}

function WalletDebitCard({
  wallet,
  isFeatured,
  language,
  t,
  formatCurrency,
  formatCardDate,
  getWalletIcon,
  onOpenDetail,
  onOpenForm,
  onOpenTransactionForm,
  onOpenTransferForm,
  onArchiveToggle,
  onDelete,
}: {
  wallet: WalletListItem;
  isFeatured: boolean;
  language: "en" | "id";
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  formatCardDate: (date: string | null) => string;
  getWalletIcon: (walletType: WalletType) => ReactNode;
  onOpenDetail: () => void;
  onOpenForm: () => void;
  onOpenTransactionForm: () => void;
  onOpenTransferForm: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  const accent = wallet.color || "#16a34a";

  return (
    <SurfaceCard
      role={isFeatured ? "featured" : "default"}
      padding="none"
      className={cn(
        "group relative isolate overflow-hidden rounded-[calc(var(--radius-card)+0.2rem)] border border-border-strong/24 shadow-none",
        isFeatured ? "md:col-span-2 xl:col-span-12" : "xl:col-span-4",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(155deg,color-mix(in_srgb,var(--surface-1)_96%,transparent),color-mix(in_srgb,var(--surface-accent)_62%,transparent))]" />
      <div
        className="pointer-events-none absolute -right-20 -top-14 h-40 w-40 rounded-full blur-2xl"
        style={{ backgroundColor: `${accent}2c` }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-16 h-40 w-40 rounded-full blur-2xl"
        style={{ backgroundColor: `${accent}20` }}
      />

      <div className="relative grid gap-3.5 p-[var(--space-panel)] lg:p-[var(--space-panel-lg)]">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            className="grid min-w-0 flex-1 gap-1 text-left"
            onClick={onOpenDetail}
          >
            <span className="truncate text-[var(--font-size-chip)] font-medium uppercase tracking-[0.09em] text-text-2">
              {t(selectedTypeLabelKey(wallet.type))}
            </span>
            <h3 className="m-0 truncate text-[1rem] font-semibold tracking-[-0.035em] text-text-1">
              {wallet.name}
            </h3>
          </button>

          <div className="flex items-center gap-1.5">
            <div
              className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.06rem)]"
              style={{
                backgroundColor: `${accent}1a`,
                color: accent,
              }}
            >
              {getWalletIcon(wallet.type)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 min-w-[2rem] rounded-full text-text-3 hover:bg-surface-1/80 hover:text-text-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  aria-label={t("nav.more")}
                >
                  <MoreHorizontal size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={onOpenForm}>
                  <Pencil size={16} />
                  {t("wallets.actions.edit")}
                </DropdownMenuItem>
                {!wallet.is_archived ? (
                  <>
                    <DropdownMenuItem onSelect={onOpenTransactionForm}>
                      <ArrowUpRight size={16} />
                      {t("wallets.actions.addTransaction")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={onOpenTransferForm}>
                      <ArrowLeftRight size={16} />
                      {t("wallets.actions.transfer")}
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuItem onSelect={onArchiveToggle}>
                  <Archive size={16} />
                  {wallet.is_archived
                    ? t("wallets.actions.restore")
                    : t("wallets.actions.archive")}
                </DropdownMenuItem>
                {wallet.transaction_count === 0 ? (
                  <DropdownMenuItem
                    className="text-danger focus:text-danger"
                    onSelect={onDelete}
                  >
                    <Trash2 size={16} />
                    {t("common.delete")}
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <button type="button" className="grid gap-1.5 text-left" onClick={onOpenDetail}>
          <strong
            className={cn(
              "font-semibold leading-none tracking-[-0.08em] text-text-1",
              isFeatured
                ? "text-[clamp(1.62rem,1.4rem+0.9vw,2.2rem)]"
                : "text-[clamp(1.34rem,1.2rem+0.45vw,1.6rem)]",
            )}
          >
            {formatCurrency(wallet.balance)}
          </strong>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[var(--font-size-meta)] text-text-2">
            <span>
              {wallet.transaction_count} {t("wallets.detail.transactions")}
            </span>
            <WalletMetaDot />
            <span>{formatCardDate(wallet.last_transaction_date)}</span>
          </div>
        </button>

        {isFeatured ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle/40 pt-2.5 text-[var(--font-size-meta)] text-text-2">
            <span>
              {language === "id" ? "Dompet utama" : "Primary wallet"}
            </span>
            <button
              type="button"
              className="font-medium text-text-1 transition hover:text-accent"
              onClick={onOpenDetail}
            >
              {language === "id" ? "Lihat detail" : "View detail"}
            </button>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

function WalletDetailContent({
  detail,
  formatCurrency,
  formatDate,
  getWalletIcon,
  t,
  onEdit,
  onAddTransaction,
  onTransfer,
  onArchiveToggle,
  onDelete,
}: {
  detail: WalletDetail;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string | null) => string;
  getWalletIcon: (walletType: WalletType) => ReactNode;
  t: (path: string) => string;
  onEdit: () => void;
  onAddTransaction: () => void;
  onTransfer: () => void;
  onArchiveToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{detail.wallet.name}</DialogTitle>
      </DialogHeader>

      <div className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div
          className="grid h-16 w-16 place-items-center rounded-[1.4rem]"
          style={{
            backgroundColor: `${detail.wallet.color || "#16a34a"}18`,
            color: detail.wallet.color || "#16a34a",
          }}
        >
          {getWalletIcon(detail.wallet.type)}
        </div>

        <div className="grid gap-2">
          <span className="text-[var(--font-size-helper)] font-medium tracking-[0.01em] text-text-2">
            {t("wallets.currentBalance")}
          </span>
          <strong className="text-[clamp(2rem,1.7rem+1vw,2.8rem)] font-semibold tracking-[-0.07em] text-text-1">
            {formatCurrency(detail.wallet.balance)}
          </strong>
          <p className="m-0 text-sm leading-6 text-text-3">
            {t("wallets.detail.lastActivity")}:{" "}
            {formatDate(detail.wallet.last_transaction_date)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <MetricCard
          label={t("wallets.detail.openingBalance")}
          value={formatCurrency(detail.wallet.initial_balance)}
        />
        <MetricCard
          label={t("wallets.detail.income")}
          value={formatCurrency(detail.wallet.income_total)}
          tone="success"
        />
        <MetricCard
          label={t("wallets.detail.expense")}
          value={formatCurrency(detail.wallet.expense_total)}
          tone="danger"
        />
        <MetricCard
          label={t("wallets.detail.transactions")}
          value={detail.wallet.transaction_count}
          tone="accent"
        />
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-border-subtle bg-surface-1 py-3">
        <Button type="button" variant="secondary" onClick={onEdit}>
          {t("wallets.actions.edit")}
        </Button>
        {!detail.wallet.is_archived ? (
          <>
            <Button type="button" variant="primary" onClick={onAddTransaction}>
              {t("wallets.actions.addTransaction")}
            </Button>
            <Button type="button" variant="secondary" onClick={onTransfer}>
              {t("wallets.actions.transfer")}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="secondary" onClick={onArchiveToggle}>
          {detail.wallet.is_archived
            ? t("wallets.actions.restore")
            : t("wallets.actions.archive")}
        </Button>
        {detail.wallet.transaction_count === 0 ? (
          <Button type="button" variant="danger" onClick={onDelete}>
            {t("common.delete")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3">
        <SectionHeading title={t("wallets.detail.recentTransactions")} />

        {detail.transactions.length === 0 ? (
          <EmptyState
            title={t("wallets.detail.noTransactions")}
            compact
            icon={<Wallet size={18} />}
          />
        ) : (
          <div className="grid gap-2.5">
            {detail.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-3.5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)]",
                    transaction.type === "income"
                      ? "bg-success-soft text-success"
                      : "bg-danger-soft text-danger",
                  )}
                >
                  {getCategoryIcon(
                    transaction.categories?.name,
                    transaction.type,
                    18,
                    transaction.categories?.icon,
                  )}
                </span>

                <div className="grid min-w-0 gap-1">
                  <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
                    {transaction.title ||
                      transaction.note ||
                      t("common.noNote")}
                  </strong>
                  <span className="text-xs text-text-3">
                    {transaction.categories?.name || t("common.uncategorized")}{" "}
                    -{" "}
                    {formatDate(
                      transaction.transaction_date || transaction.date,
                    )}
                  </span>
                </div>

                <strong
                  className={cn(
                    "text-sm font-semibold tracking-[-0.03em]",
                    transaction.type === "income"
                      ? "text-success"
                      : "text-danger",
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

