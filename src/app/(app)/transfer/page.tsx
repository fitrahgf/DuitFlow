'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmDialog } from '@/components/ConfirmDialogProvider';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import TransferForm from '@/components/TransferForm';
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
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NOTIFICATIONS_REFRESH_EVENT, TRANSACTIONS_CHANGED_EVENT } from '@/lib/events';
import { getErrorMessage } from '@/lib/errors';
import { queryKeys } from '@/lib/queries/keys';
import { fetchTransferDetail, fetchTransfers, type TransferListItem } from '@/lib/queries/transfers';
import { createClient } from '@/lib/supabase/client';

function formatDate(value: string, language: 'en' | 'id') {
  return new Date(value).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function TransferPageContent() {
  const { t, language } = useLanguage();
  const { formatCurrency } = useCurrencyPreferences();
  const confirm = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [localFormOpen, setLocalFormOpen] = useState(false);
  const [localEditId, setLocalEditId] = useState<string | null>(null);
  const [localFromWalletId, setLocalFromWalletId] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const requestedEditId = searchParams.get('edit');
  const requestedFromWalletId = searchParams.get('from');
  const activeEditId = localEditId ?? requestedEditId;
  const initialFromWalletId = localFromWalletId ?? requestedFromWalletId;
  const isFormOpen = localFormOpen || Boolean(requestedEditId) || Boolean(requestedFromWalletId);

  const transfersQuery = useQuery({
    queryKey: queryKeys.transfers.list,
    queryFn: fetchTransfers,
  });

  const transferDetailQuery = useQuery({
    queryKey: queryKeys.transfers.detail(activeEditId ?? ''),
    queryFn: () => fetchTransferDetail(activeEditId!),
    enabled: Boolean(activeEditId),
  });

  const deleteTransferMutation = useMutation({
    mutationFn: async (transferGroupId: string) => {
      const { error } = await supabase.rpc('soft_delete_transfer_group', {
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
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.overview }),
      ]);
      window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
      window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
      toast.success(t('transfers.deleteSuccess'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, t('transfers.deleteError')));
    },
  });

  const transfers = transfersQuery.data ?? [];
  const activeTransfer =
    transfers.find((transfer) => transfer.id === activeEditId) ?? transferDetailQuery.data ?? null;
  const totalMoved = transfers.reduce((total, transfer) => total + transfer.amount, 0);
  const totalFees = transfers.reduce((total, transfer) => total + transfer.fee_amount, 0);

  const closeForm = () => {
    setLocalFormOpen(false);
    setLocalEditId(null);
    setLocalFromWalletId(null);

    if (requestedEditId || requestedFromWalletId) {
      router.replace('/transfer');
    }
  };

  const handleDelete = async (transferGroupId: string) => {
    const accepted = await confirm({
      title: t('common.delete'),
      description: t('transfers.confirmDelete'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      tone: 'danger',
    });

    if (!accepted) {
      return;
    }

    deleteTransferMutation.mutate(transferGroupId);
  };

  return (
    <PageShell className="animate-fade-in">
        <PageHeader>
          <PageHeading title={t('transfers.title')} />
          <PageHeaderActions>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="max-sm:min-w-max"
              onClick={() => {
                setLocalEditId(null);
                setLocalFromWalletId(null);
              setLocalFormOpen(true);
            }}
          >
            <ArrowLeftRight size={16} />
            {t('transfers.addTransfer')}
          </Button>
        </PageHeaderActions>
      </PageHeader>

      <Dialog open={isFormOpen} onOpenChange={(open) => (!open ? closeForm() : setLocalFormOpen(true))}>
        <DialogContent className="max-w-[42rem] overflow-hidden p-0" hideClose>
          <DialogTitle className="sr-only">
            {activeEditId ? t('transfers.form.edit') : t('transfers.form.new')}
          </DialogTitle>
          {activeEditId && transferDetailQuery.isLoading && !activeTransfer ? (
            <Card className="border-0 shadow-none">
              <EmptyState title={t('common.loading')} compact />
            </Card>
          ) : (
            <TransferForm
              transfer={activeTransfer}
              initialFromWalletId={activeTransfer ? null : initialFromWalletId}
              onSuccess={closeForm}
              onCancel={closeForm}
            />
          )}
        </DialogContent>
      </Dialog>

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label={t('transfers.summary.totalMoved')}
          value={formatCurrency(totalMoved)}
          tone="accent"
        />
        <MetricCard
          label={t('transfers.summary.totalFees')}
          value={formatCurrency(totalFees)}
          tone={totalFees > 0 ? 'warning' : 'default'}
        />
        <MetricCard label={t('transfers.summary.count')} value={transfers.length} />
      </section>

      <SurfaceCard>
        <div className="grid gap-3">
          <SectionHeading title={t('transfers.list.title')} />

          {transfersQuery.isLoading ? (
            <EmptyState title={t('common.loading')} compact />
          ) : transfersQuery.isError ? (
            <EmptyState title={t('transfers.loadError')} compact />
          ) : transfers.length === 0 ? (
            <EmptyState
              title={t('transfers.noTransfers')}
              icon={<ArrowLeftRight size={20} />}
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setLocalEditId(null);
                    setLocalFromWalletId(null);
                    setLocalFormOpen(true);
                  }}
                >
                  <ArrowLeftRight size={16} />
                  {t('transfers.addTransfer')}
                </Button>
              }
            />
          ) : (
            <div className="grid gap-2.5">
              {transfers.map((transfer) => (
                <TransferRow
                  key={transfer.id}
                  transfer={transfer}
                  language={language}
                  t={t}
                  onEdit={() => {
                    setLocalEditId(transfer.id);
                    setLocalFromWalletId(null);
                    setLocalFormOpen(true);
                  }}
                  onDelete={() => handleDelete(transfer.id)}
                  deleting={deleteTransferMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      </SurfaceCard>
    </PageShell>
  );
}

function TransferRow({
  transfer,
  language,
  t,
  onEdit,
  onDelete,
  deleting,
}: {
  transfer: TransferListItem;
  language: 'en' | 'id';
  t: (key: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const { formatCurrency } = useCurrencyPreferences();
  const totalDeducted = transfer.amount + transfer.fee_amount;

  return (
    <article className="group grid gap-3 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-3.5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
      <div className="grid gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] bg-accent-soft text-accent-strong">
            <ArrowLeftRight size={18} />
          </span>

          <div className="grid min-w-0 gap-2">
            <div className="grid gap-1">
              <strong className="text-sm font-semibold tracking-[-0.02em] text-text-1">
                {transfer.from_wallet?.name || '-'} {'->'} {transfer.to_wallet?.name || '-'}
              </strong>
              <span className="text-xs text-text-3">
                {formatDate(transfer.transfer_date, language)}
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-3">
              <TransferMetric
                label={t('transfers.list.totalDeducted')}
                value={formatCurrency(totalDeducted)}
              />
              <TransferMetric
                label={t('transfers.preview.amount')}
                value={formatCurrency(transfer.amount)}
              />
              <TransferMetric
                label={t('transfers.list.fee')}
                value={
                  transfer.fee_amount > 0
                    ? formatCurrency(transfer.fee_amount)
                    : t('transfers.list.noFee')
                }
              />
            </div>

            {transfer.note ? <p className="m-0 text-sm leading-5 text-text-2">{transfer.note}</p> : null}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 justify-self-start text-text-3 md:justify-self-end md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
            aria-label={t('nav.more')}
          >
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onEdit}>
            <Pencil size={16} />
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-danger focus:text-danger" onSelect={onDelete} disabled={deleting}>
            <Trash2 size={16} />
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}

function TransferMetric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 rounded-[calc(var(--radius-card)-0.15rem)] border border-border-subtle bg-surface-1/75 p-3">
      <span className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-text-3">{label}</span>
      <strong className="text-sm font-semibold tracking-[-0.03em] text-text-1">{value}</strong>
    </div>
  );
}

export default function TransferPage() {
  return (
    <Suspense
      fallback={
        <PageShell className="animate-fade-in">
          <PageHeader>
            <PageHeading title="Transfer" />
          </PageHeader>
          <Card>
            <EmptyState title="Loading..." compact />
          </Card>
        </PageShell>
      }
    >
      <TransferPageContent />
    </Suspense>
  );
}
