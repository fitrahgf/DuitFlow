import { ArrowLeftRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { getCategoryIcon } from '@/lib/icons';
import type { TransactionDisplayItem } from '@/lib/transactionFeed';
import type { TransactionListItem } from '@/lib/queries/transactions';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const sourceBadgeVariant: Record<
  'manual' | 'quick_add' | 'telegram_bot' | 'system_transfer' | 'wishlist_conversion',
  'default' | 'accent' | 'warning'
> = {
  manual: 'default',
  quick_add: 'accent',
  telegram_bot: 'accent',
  system_transfer: 'accent',
  wishlist_conversion: 'warning',
};

function getSourceLabel(
  source: 'manual' | 'quick_add' | 'telegram_bot' | 'system_transfer' | 'wishlist_conversion',
  t: (path: string) => string
) {
  return t(`transactions.sources.${source}`);
}

function getDisplayTitle(transaction: TransactionDisplayItem, t: (path: string) => string) {
  if (transaction.kind === 'transfer') {
    return transaction.title;
  }

  return transaction.title || transaction.note || t('common.noNote');
}

export function TransactionRow({
  transaction,
  t,
  formatCurrency,
  formatDate,
  onEdit,
  onDelete,
  onDeleteTransfer,
  onEditTransfer,
  deleteTransactionPending,
  deleteTransferPending,
}: {
  transaction: TransactionDisplayItem;
  t: (path: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (value: string) => string;
  onEdit: (transaction: TransactionListItem) => void;
  onDelete: (id: string) => Promise<void>;
  onDeleteTransfer: (transferGroupId: string) => Promise<void>;
  onEditTransfer: (transferGroupId: string) => void;
  deleteTransactionPending: boolean;
  deleteTransferPending: boolean;
}) {
  if (transaction.kind === 'transfer') {
    return (
      <article className="group grid gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
        <span className="grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)] bg-accent-soft text-accent-strong">
          <ArrowLeftRight size={18} />
        </span>

        <div className="grid min-w-0 gap-2">
          <div className="grid gap-1">
            <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
              {transaction.title}
            </strong>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-3">
              <span>{t('transfers.list.from')}</span>
              <span>{transaction.fromWalletName}</span>
              <span>-</span>
              <span>{t('transfers.list.to')}</span>
              <span>{transaction.toWalletName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
            <span>{formatDate(transaction.transactionDateValue)}</span>
            <Badge variant={sourceBadgeVariant[transaction.source]}>
              {getSourceLabel(transaction.source, t)}
            </Badge>
            {transaction.feeAmount > 0 ? (
              <span>{`${t('transfers.list.fee')}: ${formatCurrency(transaction.feeAmount)}`}</span>
            ) : null}
          </div>

          {transaction.note ? <p className="m-0 text-sm leading-6 text-text-2">{transaction.note}</p> : null}
        </div>

        <div className="grid gap-2 lg:justify-items-end">
          <div className="grid gap-1 lg:text-right">
            <strong className="text-sm font-semibold tracking-[-0.03em] text-accent-strong">
              {formatCurrency(transaction.amount)}
            </strong>
            <span className="text-xs text-text-3">
              {t('transfers.list.totalDeducted')}: {formatCurrency(transaction.totalDeducted)}
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-text-3 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
                aria-label={t('nav.more')}
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onEditTransfer(transaction.transferGroupId)}>
                <Pencil size={16} />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-danger focus:text-danger"
                onSelect={() => {
                  void onDeleteTransfer(transaction.transferGroupId);
                }}
                disabled={deleteTransferPending}
              >
                <Trash2 size={16} />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </article>
    );
  }

  const iconToneClassName =
    transaction.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';

  return (
    <article className="group grid gap-4 rounded-[calc(var(--radius-card)-0.1rem)] border border-border-subtle bg-surface-2/55 p-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-start">
      <span className={cn('grid h-10 w-10 place-items-center rounded-[calc(var(--radius-control)+0.05rem)]', iconToneClassName)}>
        {getCategoryIcon(
          transaction.categories?.name,
          transaction.type,
          18,
          transaction.categories?.icon ?? undefined
        )}
      </span>

      <div className="grid min-w-0 gap-2">
        <div className="grid gap-1">
          <strong className="truncate text-sm font-semibold tracking-[-0.02em] text-text-1">
            {getDisplayTitle(transaction, t)}
          </strong>
          <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
            <span>{transaction.wallets?.name || t('transactions.unknownWallet')}</span>
            <span>-</span>
            <span>{formatDate(transaction.transactionDateValue)}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-text-3">
          <span>{transaction.categories?.name || t('common.uncategorized')}</span>
          {transaction.source !== 'manual' ? (
            <Badge variant={sourceBadgeVariant[transaction.source]}>
              {getSourceLabel(transaction.source, t)}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 lg:justify-items-end">
        <strong
          className={cn(
            'text-sm font-semibold tracking-[-0.03em]',
            transaction.type === 'income' ? 'text-success' : 'text-danger'
          )}
        >
          {transaction.type === 'income' ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </strong>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-text-3 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
              aria-label={t('nav.more')}
            >
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(transaction)}>
              <Pencil size={16} />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-danger focus:text-danger"
              onSelect={() => {
                void onDelete(transaction.id);
              }}
              disabled={deleteTransactionPending}
            >
              <Trash2 size={16} />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
