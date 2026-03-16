import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildTransactionSearchSummary,
  isTransactionFilterStateDirty,
  matchesTransactionFilters,
  matchesTransactionPeriod,
  sortTransactionItems,
} from '@/lib/transactionSearch';
import { defaultTransactionFilters } from '@/lib/queries/transactions';
import type { TransactionDisplayItem } from '@/lib/transactionFeed';

describe('transactionSearch helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-13T12:00:00.000Z'));
  });

  it('filters a regular expense by keyword and wallet', () => {
    const transaction: TransactionDisplayItem = {
      kind: 'transaction',
      id: 'tx-1',
      amount: 18000,
      type: 'expense',
      title: 'Coffee beans',
      note: 'morning brew',
      date: '2026-03-13',
      transactionDateValue: '2026-03-13',
      transaction_date: '2026-03-13',
      source: 'manual',
      category_id: 'food',
      wallet_id: 'cash',
      categories: { name: 'Food', icon: 'food' },
      wallets: { name: 'Cash', type: 'cash' },
    };

    const filters = {
      ...defaultTransactionFilters,
      search: 'coffee',
      walletId: 'cash',
      type: 'expense' as const,
    };

    expect(matchesTransactionFilters(transaction, filters)).toBe(true);
    expect(matchesTransactionPeriod(transaction, filters)).toBe(true);
  });

  it('builds search summary and sorts newest first', () => {
    const items: TransactionDisplayItem[] = [
      {
        kind: 'transaction',
        id: 'older',
        amount: 50000,
        type: 'expense',
        title: 'Lunch',
        note: null,
        date: '2026-03-10',
        transactionDateValue: '2026-03-10',
        transaction_date: '2026-03-10',
        source: 'manual',
        category_id: 'food',
        wallet_id: 'cash',
      },
      {
        kind: 'transaction',
        id: 'newer',
        amount: 100000,
        type: 'expense',
        title: 'Groceries',
        note: null,
        date: '2026-03-12',
        transactionDateValue: '2026-03-12',
        transaction_date: '2026-03-12',
        source: 'manual',
        category_id: 'shopping',
        wallet_id: 'cash',
      },
    ];

    const visible = sortTransactionItems(items, 'newest');
    const summary = buildTransactionSearchSummary(items, defaultTransactionFilters, visible);

    expect(visible[0].id).toBe('newer');
    expect(summary).toMatchObject({
      currentTotal: 150000,
      allTimeTotal: 150000,
      count: 2,
      averageAmount: 75000,
    });
    expect(summary.latestTransaction?.id).toBe('newer');
  });

  it('detects dirty filters against defaults', () => {
    expect(isTransactionFilterStateDirty(defaultTransactionFilters, defaultTransactionFilters)).toBe(false);
    expect(
      isTransactionFilterStateDirty(
        { ...defaultTransactionFilters, source: 'quick_add' },
        defaultTransactionFilters
      )
    ).toBe(true);
  });
});
