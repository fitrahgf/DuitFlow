import { describe, expect, it } from 'vitest';
import { buildTransactionDisplayItems } from '@/lib/transactionFeed';
import type { TransactionListItem } from '@/lib/queries/transactions';

describe('buildTransactionDisplayItems', () => {
  it('groups transfer entries into one transfer row and keeps regular transactions', () => {
    const rows: TransactionListItem[] = [
      {
        id: 'regular-expense',
        amount: 20000,
        type: 'expense',
        title: 'Lunch',
        note: null,
        date: '2026-03-12',
        transaction_date: '2026-03-12',
        source: 'manual',
        category_id: 'food',
        wallet_id: 'cash',
        categories: { name: 'Food', icon: 'food' },
        wallets: { name: 'Cash', type: 'cash' },
      },
      {
        id: 'transfer-out',
        amount: 500000,
        type: 'expense',
        title: 'Transfer to Bank',
        note: 'top up',
        date: '2026-03-13',
        transaction_date: '2026-03-13',
        transfer_group_id: 'group-1',
        transfer_entry_kind: 'out',
        source: 'system_transfer',
        category_id: null,
        wallet_id: 'cash',
        wallets: { name: 'Cash', type: 'cash' },
      },
      {
        id: 'transfer-in',
        amount: 500000,
        type: 'income',
        title: 'Transfer from Cash',
        note: 'top up',
        date: '2026-03-13',
        transaction_date: '2026-03-13',
        transfer_group_id: 'group-1',
        transfer_entry_kind: 'in',
        source: 'system_transfer',
        category_id: null,
        wallet_id: 'bank',
        wallets: { name: 'BCA', type: 'bank' },
      },
      {
        id: 'transfer-fee',
        amount: 2500,
        type: 'expense',
        title: 'Transfer fee',
        note: 'top up',
        date: '2026-03-13',
        transaction_date: '2026-03-13',
        transfer_group_id: 'group-1',
        transfer_entry_kind: 'fee',
        source: 'manual',
        category_id: null,
        wallet_id: 'cash',
        wallets: { name: 'Cash', type: 'cash' },
      },
    ];

    const displayItems = buildTransactionDisplayItems(rows);

    expect(displayItems).toHaveLength(2);
    expect(displayItems[0]).toMatchObject({
      kind: 'transfer',
      transferGroupId: 'group-1',
      amount: 500000,
      feeAmount: 2500,
      totalDeducted: 502500,
      fromWalletName: 'Cash',
      toWalletName: 'BCA',
    });
    expect(displayItems[1]).toMatchObject({
      kind: 'transaction',
      id: 'regular-expense',
      amount: 20000,
    });
  });
});
