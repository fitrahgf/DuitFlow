import { describe, expect, it } from 'vitest';
import {
  buildCsvContent,
  buildTransactionCsvContent,
  buildTransactionCsvRows,
  type ExportTransactionCsvRow,
} from '@/lib/export/csv';
import type { TransactionDisplayItem } from '@/lib/transactionFeed';

describe('csv export helpers', () => {
  it('escapes commas, quotes, and newlines', () => {
    const csv = buildCsvContent(
      [
        {
          title: 'Coffee, beans',
          note: 'He said "buy"\nnow',
        },
      ],
      ['title', 'note']
    );

    expect(csv).toBe('\uFEFFtitle,note\r\n"Coffee, beans","He said ""buy""\nnow"');
  });

  it('builds transaction csv rows for transfers and standard transactions', () => {
    const rows = buildTransactionCsvRows(
      [
        {
          kind: 'transaction',
          id: 'txn-1',
          amount: 120000,
          type: 'expense',
          title: 'Groceries',
          note: 'Weekly run',
          date: '2026-03-15',
          transactionDateValue: '2026-03-15',
          source: 'manual',
          category_id: 'cat-1',
          wallet_id: 'wallet-1',
          categories: { name: 'Food', icon: 'food' },
          wallets: { name: 'Cash', type: 'cash' },
        },
        {
          kind: 'transfer',
          id: 'transfer:grp-1',
          transferGroupId: 'grp-1',
          title: 'Cash -> Bank',
          note: 'Move funds',
          amount: 400000,
          feeAmount: 2500,
          totalDeducted: 402500,
          transactionDateValue: '2026-03-16',
          fromWalletId: 'wallet-1',
          toWalletId: 'wallet-2',
          fromWalletName: 'Cash',
          toWalletName: 'Bank',
          source: 'system_transfer',
        },
      ] as TransactionDisplayItem[],
      'IDR'
    );

    expect(rows).toEqual<ExportTransactionCsvRow[]>([
      {
        date: '2026-03-15',
        kind: 'transaction',
        type: 'expense',
        title: 'Groceries',
        amount: 120000,
        currency_code: 'IDR',
        wallet: 'Cash',
        category: 'Food',
        source: 'manual',
        note: 'Weekly run',
      },
      {
        date: '2026-03-16',
        kind: 'transfer',
        type: 'transfer',
        title: 'Cash -> Bank',
        amount: 400000,
        currency_code: 'IDR',
        wallet: 'Cash -> Bank',
        category: '',
        source: 'system_transfer',
        note: 'Move funds',
      },
    ]);

    expect(buildTransactionCsvContent(rows)).toContain('date,kind,type,title,amount,currency_code,wallet,category,source,note');
  });
});
