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

function MetaDot() {
  return <span className="h-1 w-1 rounded-full bg-border-strong/80" aria-hidden="true" />;
}

function SourceBadge({
  source,
  t,
  className,
}: {
  source: 'manual' | 'quick_add' | 'telegram_bot' | 'system_transfer' | 'wishlist_conversion';
  t: (path: string) => string;
  className?: string;
}) {
  return (
    <Badge
      variant={sourceBadgeVariant[source]}
      className={cn(
        "min-h-0 px-2 py-0 text-[0.62rem] font-medium tracking-[-0.01em]",
        className,
      )}
    >
      {getSourceLabel(source, t)}
    </Badge>
  );
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
    const transferTitle = `${transaction.fromWalletName} -> ${transaction.toWalletName}`;
    const hasTransferFee = transaction.feeAmount > 0;

    return (
      <article className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.25 py-1.75 transition-colors duration-200 hover:bg-surface-2/45 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.08rem)] bg-accent-soft text-accent-strong sm:h-8 sm:w-8">
          <ArrowLeftRight size={16} />
        </span>

        <div className="grid min-w-0 gap-0.5">
          <strong className="truncate text-[0.86rem] font-semibold tracking-[-0.025em] text-text-1 sm:text-[0.9rem]">
            {transferTitle}
          </strong>
          <div className="flex min-w-0 flex-nowrap items-center gap-x-1.25 overflow-hidden text-[0.72rem] leading-4 text-text-2 sm:flex-wrap sm:gap-x-1.5 sm:overflow-visible">
            <span className="shrink-0 whitespace-nowrap">{formatDate(transaction.transactionDateValue)}</span>
            {hasTransferFee ? (
              <>
                <MetaDot />
                <span className="truncate">
                  {t('transfers.list.fee')}: {formatCurrency(transaction.feeAmount)}
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-0.5 pl-1.5 sm:gap-1 sm:pl-2">
          <strong className="whitespace-nowrap text-[0.86rem] font-semibold tracking-[-0.03em] text-accent-strong sm:text-[0.92rem]">
            {formatCurrency(transaction.amount)}
          </strong>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6.5 w-6.5 min-w-[1.625rem] text-text-3 md:h-7 md:w-7 md:min-w-[1.75rem] md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
                aria-label={t('nav.more')}
              >
                <MoreHorizontal size={15} />
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
  const amountToneClassName = transaction.type === 'income' ? 'text-success' : 'text-danger';
  const categoryLabel = transaction.categories?.name || t('common.uncategorized');
  const walletLabel = transaction.wallets?.name || t('transactions.unknownWallet');
  const showSourceBadge = transaction.source === 'wishlist_conversion';

  return (
    <article className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2.25 py-1.75 transition-colors duration-200 hover:bg-surface-2/45 sm:gap-2.5 sm:px-3.5 sm:py-2.5">
      <span
        className={cn(
          'grid h-7 w-7 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.08rem)] sm:h-8 sm:w-8',
          iconToneClassName,
        )}
      >
        {getCategoryIcon(
          transaction.categories?.name,
          transaction.type,
          16,
          transaction.categories?.icon ?? undefined
        )}
      </span>

      <div className="grid min-w-0 gap-0.5">
        <strong className="truncate text-[0.86rem] font-semibold tracking-[-0.025em] text-text-1 sm:text-[0.9rem]">
          {getDisplayTitle(transaction, t)}
        </strong>

        <div className="flex min-w-0 flex-nowrap items-center gap-x-1.25 overflow-hidden text-[0.72rem] leading-4 text-text-2 sm:flex-wrap sm:overflow-visible">
          <span className="truncate">{categoryLabel}</span>
          <MetaDot />
          <span className="truncate">{walletLabel}</span>
          <MetaDot />
          <span className="shrink-0 whitespace-nowrap">{formatDate(transaction.transactionDateValue)}</span>
          {showSourceBadge ? (
            <SourceBadge source={transaction.source} t={t} className="h-5 px-1.5 text-[0.6rem]" />
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-0.5 pl-1.5 sm:gap-1 sm:pl-2">
        <strong
          className={cn(
            'whitespace-nowrap text-[0.86rem] font-semibold tracking-[-0.03em] tabular-nums sm:text-[0.92rem]',
            amountToneClassName
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
              className="h-6.5 w-6.5 min-w-[1.625rem] text-text-3 md:h-7 md:w-7 md:min-w-[1.75rem] md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
              aria-label={t('nav.more')}
            >
              <MoreHorizontal size={15} />
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
