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

    return (
      <article className="list-row group min-h-0 p-2.5 transition-all duration-200 hover:border-border-strong hover:bg-surface-2/75 md:p-3">
        <div className="flex w-full items-start gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.02rem)] bg-accent-soft text-accent-strong">
            <ArrowLeftRight size={17} />
          </span>

          <div className="grid min-w-0 flex-1 gap-1">
            <div className="flex items-start justify-between gap-3">
              <div className="grid min-w-0 gap-0.5">
                <strong className="truncate text-[0.86rem] font-semibold tracking-[-0.025em] text-text-1 sm:text-sm">
                  {transferTitle}
                </strong>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] leading-4 text-text-3">
                  <span className="whitespace-nowrap">
                    {formatDate(transaction.transactionDateValue)}
                  </span>
                  <SourceBadge source={transaction.source} t={t} className="hidden sm:inline-flex" />
                  <span className="sm:hidden">{getSourceLabel(transaction.source, t)}</span>
                  {transaction.feeAmount > 0 ? (
                    <>
                      <MetaDot />
                      <span className="whitespace-nowrap">
                        {t('transfers.list.fee')}: {formatCurrency(transaction.feeAmount)}
                      </span>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 items-start gap-1.5 pl-2">
                <div className="grid justify-items-end gap-0.5 text-right">
                  <strong className="text-[0.86rem] font-semibold tracking-[-0.03em] text-accent-strong sm:text-[0.92rem]">
                    {formatCurrency(transaction.amount)}
                  </strong>
                  <span className="whitespace-nowrap text-[0.68rem] leading-4 text-text-3">
                    {t('transfers.list.totalDeducted')}: {formatCurrency(transaction.totalDeducted)}
                  </span>
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
            </div>

            {transaction.note ? (
              <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] leading-4 text-text-2">
                {transaction.note}
              </p>
            ) : null}
          </div>
        </div>
      </article>
    );
  }

  const iconToneClassName =
    transaction.type === 'income' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger';
  const amountToneClassName = transaction.type === 'income' ? 'text-success' : 'text-danger';
  const categoryLabel = transaction.categories?.name || t('common.uncategorized');
  const walletLabel = transaction.wallets?.name || t('transactions.unknownWallet');

  return (
    <article className="list-row group min-h-0 p-2.5 transition-all duration-200 hover:border-border-strong hover:bg-surface-2/75 md:p-3">
      <div className="flex w-full items-start gap-2.5">
        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-[calc(var(--radius-control)-0.02rem)]', iconToneClassName)}>
          {getCategoryIcon(
            transaction.categories?.name,
            transaction.type,
            17,
            transaction.categories?.icon ?? undefined
          )}
        </span>

        <div className="grid min-w-0 flex-1 gap-1">
          <div className="flex items-start justify-between gap-3">
            <div className="grid min-w-0 gap-0.5">
              <strong className="truncate text-[0.86rem] font-semibold tracking-[-0.025em] text-text-1 sm:text-sm">
                {getDisplayTitle(transaction, t)}
              </strong>
            </div>

            <div className="flex shrink-0 items-start gap-1.5 pl-2">
              <strong
                className={cn(
                  'whitespace-nowrap text-[0.86rem] font-semibold tracking-[-0.03em] sm:text-[0.92rem]',
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
                    className="h-8 w-8 min-w-[2rem] text-text-3 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:focus-visible:opacity-100"
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
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.72rem] leading-4 text-text-3">
            <span className="truncate">{categoryLabel}</span>
            <MetaDot />
            <span className="truncate">{walletLabel}</span>
            <MetaDot />
            <span className="whitespace-nowrap">{formatDate(transaction.transactionDateValue)}</span>
            {transaction.source !== 'manual' ? (
              <>
                <SourceBadge source={transaction.source} t={t} className="hidden sm:inline-flex" />
                <span className="sm:hidden">{getSourceLabel(transaction.source, t)}</span>
              </>
            ) : null}
          </div>

          {transaction.note ? (
            <p className="m-0 overflow-hidden text-ellipsis whitespace-nowrap text-[0.72rem] leading-4 text-text-2">
              {transaction.note}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
