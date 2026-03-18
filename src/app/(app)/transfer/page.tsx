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
import { ModalShell } from '@/components/shared/ModalShell';
import {
  PageHeader,
  PageHeaderActions,
  PageHeading,
  PageShell,
  SurfaceCard,
} from '@/components/shared/PagePrimitives';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
            className="w-full sm:w-auto"
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

      <ModalShell
        open={isFormOpen}
        onOpenChange={(open) => (!open ? closeForm() : setLocalFormOpen(true))}
        title={activeEditId ? t('transfers.form.edit') : t('transfers.form.new')}
        size="lg"
        padding="flush"
        hideClose
        headerHidden
      >
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
      </ModalShell>

      <SurfaceCard padding="compact">
        <div className="grid gap-0 divide-y divide-border-subtle/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <TransferSummaryItem
            label={t('transfers.summary.totalMoved')}
            value={formatCurrency(totalMoved)}
          />
          <TransferSummaryItem
            label={t('transfers.summary.totalFees')}
            value={formatCurrency(totalFees)}
            tone={totalFees > 0 ? 'warning' : 'default'}
          />
          <TransferSummaryItem
            label={t('transfers.summary.count')}
            value={String(transfers.length)}
          />
        </div>
      </SurfaceCard>

      <SurfaceCard padding="compact">
        <div className="grid gap-2">
          <div className="flex items-end justify-between gap-3">
            <div className="grid gap-0.5">
              <h2 className="m-0 text-[1rem] font-semibold tracking-[-0.04em] text-text-1">
                {t('transfers.list.title')}
              </h2>
              <span className="text-[0.8rem] text-text-2">
                {language === 'id'
                  ? `${transfers.length} transfer terbaru`
                  : `${transfers.length} recent transfers`}
              </span>
            </div>
          </div>

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
            <div className="grid gap-0 divide-y divide-border-subtle/80">
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
  const hasFee = transfer.fee_amount > 0;

  return (
    <article className="group grid gap-2.5 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.02rem)] bg-accent-soft/80 text-accent-strong">
          <ArrowLeftRight size={17} />
        </span>

        <div className="grid min-w-0 flex-1 gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="truncate text-[0.92rem] font-semibold tracking-[-0.03em] text-text-1 sm:text-[0.96rem]">
              {transfer.from_wallet?.name || '-'} {'->'} {transfer.to_wallet?.name || '-'}
            </strong>
            {hasFee ? (
              <span className="rounded-full bg-warning-soft/80 px-2 py-0.5 text-[0.68rem] font-medium text-warning-strong">
                {language === 'id' ? 'Ada potongan' : 'Fee'}
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.76rem] leading-5 text-text-2">
            <span className="whitespace-nowrap">{formatDate(transfer.transfer_date, language)}</span>
            {hasFee ? (
              <>
                <span className="h-1 w-1 rounded-full bg-border-strong/80" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {t('transfers.list.fee')}: {formatCurrency(transfer.fee_amount)}
                </span>
                <span className="h-1 w-1 rounded-full bg-border-strong/80" aria-hidden="true" />
                <span className="whitespace-nowrap">
                  {t('transfers.list.totalDeducted')}: {formatCurrency(totalDeducted)}
                </span>
              </>
            ) : null}
            {transfer.note ? (
              <>
                <span className="h-1 w-1 rounded-full bg-border-strong/80" aria-hidden="true" />
                <span className="truncate">{transfer.note}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="grid justify-items-start gap-0.5 text-left md:justify-items-end md:text-right">
          <strong className="text-[0.94rem] font-semibold tracking-[-0.035em] text-accent-strong sm:text-[1rem]">
            {formatCurrency(transfer.amount)}
          </strong>
          {hasFee ? (
            <span className="whitespace-nowrap text-[0.72rem] leading-4 text-text-2">
              {language === 'id' ? 'Keluar total' : 'Total deducted'}: {formatCurrency(totalDeducted)}
            </span>
          ) : (
            <span className="whitespace-nowrap text-[0.72rem] leading-4 text-text-3">
              {language === 'id' ? 'Tanpa potongan' : 'No fee'}
            </span>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 min-w-[2rem] text-text-3 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
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
      </div>
    </article>
  );
}

function TransferSummaryItem({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <div className="grid gap-0.5 px-0 py-2.5 first:pt-0 last:pb-0 sm:px-3 sm:py-0 sm:first:pl-0 sm:last:pr-0">
      <span className="text-[0.76rem] font-medium text-text-2">{label}</span>
      <strong
        className={
          tone === 'warning'
            ? 'text-[0.98rem] font-semibold tracking-[-0.04em] text-warning-strong'
            : 'text-[0.98rem] font-semibold tracking-[-0.04em] text-text-1'
        }
      >
        {value}
      </strong>
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
