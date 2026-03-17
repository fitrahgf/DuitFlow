'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowLeftRight,
  ArrowUpRight,
  Coins,
  Landmark,
  Pencil,
  Smartphone,
  Trash2,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import TransactionForm from '@/components/TransactionForm';
import { useLanguage } from '@/components/LanguageProvider';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  MetricCard,
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SectionHeading,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { getCategoryIcon } from '@/lib/icons';
import { queryKeys } from '@/lib/queries/keys';
import {
  fetchWalletDetail,
  fetchWallets,
  type WalletDetail,
  type WalletListItem,
} from '@/lib/queries/wallets';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { walletFormSchema } from '@/lib/validators/wallet';

type WalletType = WalletListItem['type'];
type WalletView = 'active' | 'archived';

const typeOptions: { value: WalletType; labelKey: string; icon: LucideIcon }[] = [
  { value: 'cash', labelKey: 'wallets.types.cash', icon: Coins },
  { value: 'bank', labelKey: 'wallets.types.bank', icon: Landmark },
  { value: 'e-wallet', labelKey: 'wallets.types.e-wallet', icon: Smartphone },
  { value: 'other', labelKey: 'wallets.types.other', icon: Wallet },
];

export default function WalletsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const [view, setView] = useState<WalletView>('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletListItem | null>(null);
  const [detailWalletId, setDetailWalletId] = useState<string | null>(null);
  const [transactionWalletId, setTransactionWalletId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('cash');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#16a34a');
  const [icon, setIcon] = useState('cash');
  const [supabase] = useState(() => createClient());
  const walletFormTitle = editingWallet ? t('wallets.form.edit') : t('wallets.form.new');
  const walletEssentialTitle = language === 'id' ? 'Utama' : 'Essential';
  const walletAppearanceTitle = language === 'id' ? 'Tampilan' : 'Appearance';
  const selectedTypeOption = typeOptions.find((option) => option.value === type) ?? typeOptions[0];
  const SelectedTypeIcon = selectedTypeOption.icon;

  const walletsQuery = useQuery({
    queryKey: queryKeys.wallets.list(view),
    queryFn: () => fetchWallets(view),
  });

  const walletDetailQuery = useQuery({
    queryKey: queryKeys.wallets.detail(detailWalletId ?? ''),
    queryFn: () => fetchWalletDetail(detailWalletId!),
    enabled: Boolean(detailWalletId),
  });

  useEffect(() => {
    const handleTransactionsChanged = () =>
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
    window.addEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
    return () => window.removeEventListener(TRANSACTIONS_CHANGED_EVENT, handleTransactionsChanged);
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
        throw new Error(t('auth.login.error'));
      }

      const parsed = walletFormSchema.safeParse({
        name,
        type,
        initialBalance: parseInt(balance, 10) || 0,
        color,
        icon,
      });

      if (!parsed.success) {
        throw new Error(t('wallets.form.saveError'));
      }

      const walletData = {
        name: parsed.data.name,
        type: parsed.data.type,
        color: parsed.data.color,
        icon: parsed.data.icon,
      };

      if (editingWallet) {
        const { error } = await supabase.from('wallets').update(walletData).eq('id', editingWallet.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from('wallets').insert({
        user_id: user.id,
        ...walletData,
        balance: parsed.data.initialBalance,
        initial_balance: parsed.data.initialBalance,
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      setIsFormOpen(false);
      setEditingWallet(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      toast.success(t('wallets.form.saveSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('wallets.form.saveError')));
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
        .from('wallets')
        .update({
          is_archived: archive,
          is_active: !archive,
        })
        .eq('id', walletId);

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
        variables.archive ? t('wallets.archiveSuccess') : t('wallets.restoreSuccess')
      );
    },
    onError: (error, variables) => {
      toast.error(
        getErrorMessage(
          error,
          variables.archive ? t('wallets.archiveError') : t('wallets.restoreError')
        )
      );
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (walletId: string) => {
      const { error } = await supabase.from('wallets').delete().eq('id', walletId);
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.wallets.all });
      if (detailWalletId) {
        setDetailWalletId(null);
      }
      toast.success(t('wallets.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('wallets.deleteError')));
    },
  });

  const handleOpenForm = (wallet: WalletListItem | null = null) => {
    if (wallet) {
      setEditingWallet(wallet);
      setName(wallet.name);
      setType(wallet.type);
      setBalance(String(wallet.initial_balance ?? wallet.balance));
      setColor(wallet.color || '#16a34a');
      setIcon(wallet.icon || wallet.type);
    } else {
      setEditingWallet(null);
      setName('');
      setType('cash');
      setBalance('0');
      setColor('#16a34a');
      setIcon('cash');
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
      ? new Date(date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : t('wallets.noActivity');

  const getWalletIcon = (walletType: WalletType) => {
    switch (walletType) {
      case 'bank':
        return <Landmark size={22} />;
      case 'e-wallet':
        return <Smartphone size={22} />;
      case 'cash':
        return <Coins size={22} />;
      default:
        return <Wallet size={22} />;
    }
  };

  const handleArchiveToggle = async (wallet: WalletListItem) => {
    const nextArchiveState = !wallet.is_archived;
    const accepted = await confirm({
      title: nextArchiveState ? t('wallets.actions.archive') : t('wallets.actions.restore'),
      description: nextArchiveState ? t('wallets.confirmArchive') : t('wallets.confirmRestore'),
      confirmLabel: nextArchiveState ? t('wallets.actions.archive') : t('wallets.actions.restore'),
      cancelLabel: t('common.cancel'),
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
      toast.error(t('wallets.deleteBlocked'));
      return;
    }

    const accepted = await confirm({
      title: t('common.delete'),
      description: t('wallets.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    deleteWalletMutation.mutate(wallet.id);
  };

  const walletDetail = walletDetailQuery.data;
  const wallets = walletsQuery.data ?? [];
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <PageShell className="animate-fade-in">
      <PageHeader>
        <PageHeading title={t('wallets.title')} />
        <PageHeaderActions>
          <Button type="button" variant="primary" className="max-sm:hidden" onClick={() => handleOpenForm()}>
            {t('wallets.addWallet')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <SurfaceCard>
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-text-3">{t('wallets.view')}</span>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(['active', 'archived'] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={view === value ? 'primary' : 'secondary'}
                    className="min-w-max"
                    onClick={() => setView(value)}
                  >
                    {t(`wallets.tabs.${value}`)}
                  </Button>
                ))}
              </div>
            </div>

            <Button type="button" variant="primary" size="sm" className="sm:hidden" onClick={() => handleOpenForm()}>
              {t('wallets.addWallet')}
            </Button>
          </div>

          <MetricCard
            label={t('wallets.totalBalance')}
            value={formatCurrency(totalBalance)}
            tone="accent"
            className="min-w-0"
          />
        </div>
      </SurfaceCard>

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
            <div className="grid gap-3">
              <FormSectionHeader step="01" title={walletEssentialTitle} />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="input-group md:col-span-2">
                  <label className="input-label" htmlFor="wallet-name">
                    {t('wallets.form.name')}
                  </label>
                  <Input
                    id="wallet-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="BCA, Dana, Main Wallet"
                    className="min-h-[2.85rem] px-3.5 py-2.5"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="wallet-balance">
                    {t('wallets.form.balance')}
                  </label>
                  <CurrencyInput
                    id="wallet-balance"
                    value={balance}
                    onValueChange={setBalance}
                    disabled={Boolean(editingWallet)}
                    className="min-h-[2.85rem] px-3.5 py-2.5"
                    required
                  />
                  {editingWallet ? (
                    <p className="m-0 text-xs leading-5 text-text-3">{t('wallets.form.balanceManagedHint')}</p>
                  ) : null}
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="wallet-color">
                    {t('wallets.form.color')}
                  </label>
                  <input
                    id="wallet-color"
                    type="color"
                    className="input h-[2.85rem] p-1.5"
                    value={color}
                    onChange={(event) => setColor(event.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  {t('wallets.form.type')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {typeOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={type === option.value ? 'primary' : 'secondary'}
                      className="min-h-[2.85rem] justify-start rounded-[calc(var(--radius-card)-0.18rem)] px-3.5"
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
              </div>
            </div>

            <div className="grid gap-3">
              <FormSectionHeader step="02" title={walletAppearanceTitle} />

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
                        {name.trim() || t('wallets.form.new')}
                      </strong>
                      <span className="text-sm text-text-3">{t(selectedTypeOption.labelKey)}</span>
                    </div>
                  </div>
                </Card>
            </div>

            <div className="grid gap-2.5 pt-1 sm:grid-cols-2">
              <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={saveWalletMutation.isPending}>
                {saveWalletMutation.isPending ? t('common.loading') : t('common.save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isTransactionFormOpen} onOpenChange={setIsTransactionFormOpen}>
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogHeader className="sr-only">
            <DialogTitle>{t('transactions.form.new')}</DialogTitle>
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
            <DialogTitle>{walletDetail?.wallet.name ?? t('nav.wallets')}</DialogTitle>
          </DialogHeader>
          {walletDetailQuery.isLoading ? (
            <EmptyState title={t('common.loading')} compact />
          ) : walletDetailQuery.isError || !walletDetail ? (
            <EmptyState title={t('wallets.detail.loadError')} compact />
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

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {walletsQuery.isLoading ? (
          <SurfaceCard className="sm:col-span-2 xl:col-span-3">
            <EmptyState title={t('common.loading')} compact />
          </SurfaceCard>
        ) : walletsQuery.isError ? (
          <SurfaceCard className="sm:col-span-2 xl:col-span-3">
            <EmptyState title={t('wallets.loadError')} compact />
          </SurfaceCard>
        ) : wallets.length === 0 ? (
          <SurfaceCard className="sm:col-span-2 xl:col-span-3">
            <EmptyState
              title={view === 'active' ? t('wallets.noWallets') : t('wallets.noArchivedWallets')}
              compact
              icon={<Wallet size={18} />}
            />
          </SurfaceCard>
        ) : (
          wallets.map((wallet) => (
            <article
              key={wallet.id}
              className="overflow-hidden rounded-[var(--radius-card)] border border-border-subtle bg-surface-1 shadow-xs"
              style={{ borderTop: `4px solid ${wallet.color || '#16a34a'}` }}
            >
              <button
                type="button"
                className="grid w-full gap-3 p-3.5 text-left transition hover:bg-surface-2/55"
                onClick={() => setDetailWalletId(wallet.id)}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[1rem]"
                    style={{
                      backgroundColor: `${wallet.color || '#16a34a'}18`,
                      color: wallet.color || '#16a34a',
                    }}
                  >
                    {getWalletIcon(wallet.type)}
                  </div>

                  <div className="grid min-w-0 flex-1 gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="grid min-w-0 gap-0.5">
                        <h3 className="m-0 truncate text-[0.98rem] font-semibold tracking-[-0.03em] text-text-1">
                          {wallet.name}
                        </h3>
                        <p className="m-0 text-xs text-text-3">{t(`wallets.types.${wallet.type}`)}</p>
                      </div>

                      <div className="grid shrink-0 justify-items-end gap-0.5">
                        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-text-3">
                          {t('wallets.currentBalance')}
                        </span>
                        <strong className="text-base font-semibold tracking-[-0.04em] text-text-1">
                          {formatCurrency(wallet.balance)}
                        </strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-text-3">
                      <span>{wallet.transaction_count} {t('wallets.detail.transactions')}</span>
                      <span>{t('wallets.detail.income')}: {formatCurrency(wallet.income_total)}</span>
                      <span>{formatDate(wallet.last_transaction_date)}</span>
                    </div>
                  </div>
                </div>
              </button>

              <div className="flex flex-wrap gap-2 border-t border-border-subtle bg-surface-2/35 px-3.5 py-2.5">
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-2xl" onClick={() => handleOpenForm(wallet)}>
                  <Pencil size={16} />
                </Button>
                {!wallet.is_archived ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-2xl"
                      onClick={() => openTransactionFormForWallet(wallet.id)}
                    >
                      <ArrowUpRight size={16} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-2xl"
                      onClick={() => openTransferFormForWallet(wallet.id)}
                    >
                      <ArrowLeftRight size={16} />
                    </Button>
                  </>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-2xl"
                  onClick={() => {
                    void handleArchiveToggle(wallet);
                  }}
                >
                  <Archive size={16} />
                </Button>
                {wallet.transaction_count === 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-2xl text-danger"
                    onClick={() => {
                      void handleDelete(wallet);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </section>
    </PageShell>
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
            backgroundColor: `${detail.wallet.color || '#16a34a'}18`,
            color: detail.wallet.color || '#16a34a',
          }}
        >
          {getWalletIcon(detail.wallet.type)}
        </div>

        <div className="grid gap-2">
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-text-3">
            {t('wallets.currentBalance')}
          </span>
          <strong className="text-[clamp(2rem,1.7rem+1vw,2.8rem)] font-semibold tracking-[-0.07em] text-text-1">
            {formatCurrency(detail.wallet.balance)}
          </strong>
          <p className="m-0 text-sm leading-6 text-text-3">
            {t('wallets.detail.lastActivity')}: {formatDate(detail.wallet.last_transaction_date)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <MetricCard
          label={t('wallets.detail.openingBalance')}
          value={formatCurrency(detail.wallet.initial_balance)}
        />
        <MetricCard
          label={t('wallets.detail.income')}
          value={formatCurrency(detail.wallet.income_total)}
          tone="success"
        />
        <MetricCard
          label={t('wallets.detail.expense')}
          value={formatCurrency(detail.wallet.expense_total)}
          tone="danger"
        />
        <MetricCard
          label={t('wallets.detail.transactions')}
          value={detail.wallet.transaction_count}
          tone="accent"
        />
      </div>

      <div className="sticky bottom-0 z-10 flex flex-wrap gap-2 border-t border-border-subtle bg-surface-1 py-3">
        <Button type="button" variant="secondary" onClick={onEdit}>
          {t('wallets.actions.edit')}
        </Button>
        {!detail.wallet.is_archived ? (
          <>
            <Button type="button" variant="primary" onClick={onAddTransaction}>
              {t('wallets.actions.addTransaction')}
            </Button>
            <Button type="button" variant="secondary" onClick={onTransfer}>
              {t('wallets.actions.transfer')}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="secondary" onClick={onArchiveToggle}>
          {detail.wallet.is_archived ? t('wallets.actions.restore') : t('wallets.actions.archive')}
        </Button>
        {detail.wallet.transaction_count === 0 ? (
          <Button type="button" variant="danger" onClick={onDelete}>
            {t('common.delete')}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3">
        <SectionHeading title={t('wallets.detail.recentTransactions')} />

        {detail.transactions.length === 0 ? (
          <EmptyState title={t('wallets.detail.noTransactions')} compact icon={<Wallet size={18} />} />
        ) : (
          <div className="grid gap-2.5">
            {detail.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-3.5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start"
              >
                <span
                  className={cn(
                    'grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)]',
                    transaction.type === 'income'
                      ? 'bg-success-soft text-success'
                      : 'bg-danger-soft text-danger'
                  )}
                >
                  {getCategoryIcon(
                    transaction.categories?.name,
                    transaction.type,
                    18,
                    transaction.categories?.icon
                  )}
                </span>

                <div className="grid min-w-0 gap-1">
                  <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
                    {transaction.title || transaction.note || t('common.noNote')}
                  </strong>
                  <span className="text-xs text-text-3">
                    {transaction.categories?.name || t('common.uncategorized')} -{' '}
                    {formatDate(transaction.transaction_date || transaction.date)}
                  </span>
                </div>

                <strong
                  className={cn(
                    'text-sm font-semibold tracking-[-0.03em]',
                    transaction.type === 'income' ? 'text-success' : 'text-danger'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
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
