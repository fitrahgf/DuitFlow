import { endOfDay, isSameMonth, parseISO, startOfDay, subDays } from 'date-fns';
import type { TransactionFilters, TransactionSortOption } from '@/lib/queries/transactions';
import {
  getTransactionDisplayDate,
  getTransactionSearchText,
  getTransactionSummaryAmount,
  type TransactionDisplayItem,
} from '@/lib/transactionFeed';

export type TransactionSearchSummary = {
  allTimeTotal: number;
  last30DaysTotal: number;
  last7DaysTotal: number;
  currentTotal: number;
  averageAmount: number;
  count: number;
  latestTransaction: TransactionDisplayItem | null;
};

const MIN_DATE_STRING_LENGTH = 10;

function getTransactionDate(transaction: TransactionDisplayItem) {
  return parseISO(getTransactionDisplayDate(transaction));
}

export function matchesTransactionSearch(transaction: TransactionDisplayItem, search: string) {
  if (!search) {
    return true;
  }

  return getTransactionSearchText(transaction).includes(search.toLowerCase());
}

export function matchesTransactionPeriod(transaction: TransactionDisplayItem, filters: TransactionFilters) {
  if (filters.period === 'all') {
    return true;
  }

  const transactionDate = getTransactionDate(transaction);
  const today = new Date();

  if (filters.period === 'month') {
    return isSameMonth(transactionDate, today);
  }

  if (filters.period === '30d') {
    return transactionDate >= startOfDay(subDays(today, 29));
  }

  if (filters.period === '7d') {
    return transactionDate >= startOfDay(subDays(today, 6));
  }

  if (filters.period === 'custom') {
    const fromDate =
      filters.customFrom.length >= MIN_DATE_STRING_LENGTH ? startOfDay(parseISO(filters.customFrom)) : null;
    const toDate =
      filters.customTo.length >= MIN_DATE_STRING_LENGTH ? endOfDay(parseISO(filters.customTo)) : null;

    if (fromDate && transactionDate < fromDate) {
      return false;
    }

    if (toDate && transactionDate > toDate) {
      return false;
    }
  }

  return true;
}

export function matchesTransactionFilters(transaction: TransactionDisplayItem, filters: TransactionFilters) {
  const minAmount = Number(filters.minAmount || 0);
  const maxAmount = Number(filters.maxAmount || 0);

  if (transaction.kind === 'transfer') {
    if (filters.type === 'income' || filters.type === 'expense') {
      return false;
    }

    if (filters.walletId && transaction.fromWalletId !== filters.walletId && transaction.toWalletId !== filters.walletId) {
      return false;
    }

    if (filters.categoryId) {
      return false;
    }

    if (filters.source !== 'all' && filters.source !== 'system_transfer') {
      return false;
    }

    if (filters.search && !matchesTransactionSearch(transaction, filters.search)) {
      return false;
    }

    if (filters.minAmount && transaction.amount < minAmount) {
      return false;
    }

    if (filters.maxAmount && transaction.amount > maxAmount) {
      return false;
    }

    return true;
  }

  const isTransfer = transaction.source === 'system_transfer';

  if (filters.type === 'transfer' && !isTransfer) {
    return false;
  }

  if (filters.type === 'income' && (transaction.type !== 'income' || isTransfer)) {
    return false;
  }

  if (filters.type === 'expense' && (transaction.type !== 'expense' || isTransfer)) {
    return false;
  }

  if (filters.walletId && transaction.wallet_id !== filters.walletId) {
    return false;
  }

  if (filters.categoryId && transaction.category_id !== filters.categoryId) {
    return false;
  }

  if (filters.source !== 'all' && transaction.source !== filters.source) {
    return false;
  }

  if (filters.search && !matchesTransactionSearch(transaction, filters.search)) {
    return false;
  }

  if (filters.minAmount && transaction.amount < minAmount) {
    return false;
  }

  if (filters.maxAmount && transaction.amount > maxAmount) {
    return false;
  }

  return true;
}

export function sortTransactionItems(
  transactions: TransactionDisplayItem[],
  sort: TransactionSortOption
) {
  const sortedTransactions = [...transactions];

  sortedTransactions.sort((left, right) => {
    if (sort === 'oldest') {
      return getTransactionDate(left).getTime() - getTransactionDate(right).getTime();
    }

    if (sort === 'highest') {
      return right.amount - left.amount;
    }

    if (sort === 'lowest') {
      return left.amount - right.amount;
    }

    return getTransactionDate(right).getTime() - getTransactionDate(left).getTime();
  });

  return sortedTransactions;
}

export function getTransactionSummarySource(filters: TransactionFilters) {
  if (filters.type === 'income') {
    return 'income' as const;
  }

  if (filters.type === 'transfer' || filters.source === 'system_transfer') {
    return 'transfer' as const;
  }

  return 'expense' as const;
}

export function buildTransactionSearchSummary(
  transactions: TransactionDisplayItem[],
  filters: TransactionFilters,
  visibleTransactions: TransactionDisplayItem[]
): TransactionSearchSummary {
  const summarySource = getTransactionSummarySource(filters);
  const today = new Date();
  const last30Boundary = startOfDay(subDays(today, 29));
  const last7Boundary = startOfDay(subDays(today, 6));

  const eligibleTransactions = transactions.filter(
    (transaction) => getTransactionSummaryAmount(transaction, summarySource) > 0
  );
  const visibleEligibleTransactions = visibleTransactions.filter(
    (transaction) => getTransactionSummaryAmount(transaction, summarySource) > 0
  );

  const allTimeTotal = eligibleTransactions.reduce(
    (total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource),
    0
  );
  const last30DaysTotal = eligibleTransactions
    .filter((transaction) => getTransactionDate(transaction) >= last30Boundary)
    .reduce((total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource), 0);
  const last7DaysTotal = eligibleTransactions
    .filter((transaction) => getTransactionDate(transaction) >= last7Boundary)
    .reduce((total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource), 0);
  const currentTotal = visibleEligibleTransactions.reduce(
    (total, transaction) => total + getTransactionSummaryAmount(transaction, summarySource),
    0
  );
  const latestTransaction = visibleEligibleTransactions[0] ?? eligibleTransactions[0] ?? null;

  return {
    allTimeTotal,
    last30DaysTotal,
    last7DaysTotal,
    currentTotal,
    count: visibleTransactions.length,
    averageAmount:
      visibleEligibleTransactions.length > 0 ? Math.round(currentTotal / visibleEligibleTransactions.length) : 0,
    latestTransaction,
  };
}

export function isTransactionFilterStateDirty(filters: TransactionFilters, defaults: TransactionFilters) {
  return (
    filters.type !== defaults.type ||
    filters.walletId !== defaults.walletId ||
    filters.categoryId !== defaults.categoryId ||
    filters.period !== defaults.period ||
    filters.customFrom !== defaults.customFrom ||
    filters.customTo !== defaults.customTo ||
    filters.source !== defaults.source ||
    filters.minAmount !== defaults.minAmount ||
    filters.maxAmount !== defaults.maxAmount ||
    filters.sort !== defaults.sort
  );
}
