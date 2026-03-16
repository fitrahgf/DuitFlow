import { describe, expect, it } from 'vitest';
import { computeWalletLedgerBalance, summarizeWalletFlows } from '@/lib/walletBalance';

describe('walletBalance helpers', () => {
  it('computes wallet balance from initial balance and active ledger entries', () => {
    const transactions = [
      { amount: 500000, type: 'income' as const },
      { amount: 120000, type: 'expense' as const },
      { amount: 75000, type: 'expense' as const, deleted_at: '2026-03-13T10:00:00.000Z' },
    ];

    expect(computeWalletLedgerBalance(1000000, transactions)).toBe(1380000);
  });

  it('summarizes only active wallet flows', () => {
    const summary = summarizeWalletFlows([
      { amount: 200000, type: 'income' as const },
      { amount: 50000, type: 'expense' as const },
      { amount: 10000, type: 'expense' as const, deleted_at: '2026-03-13T10:00:00.000Z' },
    ]);

    expect(summary).toMatchObject({
      incomeTotal: 200000,
      expenseTotal: 50000,
      transactionCount: 2,
    });
  });
});
