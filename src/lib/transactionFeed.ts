import type { TransactionListItem } from '@/lib/queries/transactions';

export interface StandardTransactionDisplayItem extends TransactionListItem {
  kind: 'transaction';
  transactionDateValue: string;
}

export interface TransferTransactionDisplayItem {
  kind: 'transfer';
  id: string;
  transferGroupId: string;
  title: string;
  note: string | null;
  amount: number;
  feeAmount: number;
  totalDeducted: number;
  transactionDateValue: string;
  fromWalletId: string | null;
  toWalletId: string | null;
  fromWalletName: string;
  toWalletName: string;
  source: 'system_transfer';
}

export type TransactionDisplayItem = StandardTransactionDisplayItem | TransferTransactionDisplayItem;

export function getTransactionDisplayDate(item: TransactionDisplayItem) {
  return item.transactionDateValue;
}

export function getTransactionSearchText(item: TransactionDisplayItem) {
  if (item.kind === 'transfer') {
    return [item.title, item.note, item.fromWalletName, item.toWalletName, 'transfer']
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  return [item.title, item.note, item.categories?.name, item.wallets?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getTransactionSummaryAmount(
  item: TransactionDisplayItem,
  summarySource: 'expense' | 'income' | 'transfer'
) {
  if (item.kind === 'transfer') {
    if (summarySource === 'transfer') {
      return item.amount;
    }

    if (summarySource === 'expense') {
      return item.feeAmount;
    }

    return 0;
  }

  if (summarySource === 'income') {
    return item.type === 'income' && item.source !== 'system_transfer' ? item.amount : 0;
  }

  if (summarySource === 'expense') {
    return item.type === 'expense' && item.source !== 'system_transfer' ? item.amount : 0;
  }

  return 0;
}

export function buildTransactionDisplayItems(transactions: TransactionListItem[]) {
  const transferBuckets = new Map<string, TransactionListItem[]>();
  const displayItems: TransactionDisplayItem[] = [];

  for (const transaction of transactions) {
    if (transaction.transfer_group_id) {
      const bucket = transferBuckets.get(transaction.transfer_group_id) ?? [];
      bucket.push(transaction);
      transferBuckets.set(transaction.transfer_group_id, bucket);
      continue;
    }

    displayItems.push({
      ...transaction,
      kind: 'transaction',
      transactionDateValue: transaction.transaction_date || transaction.date,
    });
  }

  transferBuckets.forEach((items, transferGroupId) => {
    const outgoing =
      items.find((item) => item.transfer_entry_kind === 'out') ??
      items.find((item) => item.source === 'system_transfer' && item.type === 'expense') ??
      null;
    const incoming =
      items.find((item) => item.transfer_entry_kind === 'in') ??
      items.find((item) => item.source === 'system_transfer' && item.type === 'income') ??
      null;
    const fee =
      items.find((item) => item.transfer_entry_kind === 'fee') ??
      items.find((item) => item.source !== 'system_transfer' && item.type === 'expense') ??
      null;

    if (!outgoing || !incoming) {
      items.forEach((transaction) =>
        displayItems.push({
          ...transaction,
          kind: 'transaction',
          transactionDateValue: transaction.transaction_date || transaction.date,
        })
      );
      return;
    }

    const fromWalletName = outgoing.wallets?.name || 'Wallet';
    const toWalletName = incoming.wallets?.name || 'Wallet';

    displayItems.push({
      kind: 'transfer',
      id: `transfer:${transferGroupId}`,
      transferGroupId,
      title: `${fromWalletName} -> ${toWalletName}`,
      note: outgoing.note || incoming.note || fee?.note || null,
      amount: outgoing.amount,
      feeAmount: fee?.amount ?? 0,
      totalDeducted: outgoing.amount + (fee?.amount ?? 0),
      transactionDateValue: outgoing.transaction_date || outgoing.date,
      fromWalletId: outgoing.wallet_id,
      toWalletId: incoming.wallet_id,
      fromWalletName,
      toWalletName,
      source: 'system_transfer',
    });
  });

  return displayItems.sort(
    (left, right) =>
      new Date(getTransactionDisplayDate(right)).getTime() -
      new Date(getTransactionDisplayDate(left)).getTime()
  );
}
