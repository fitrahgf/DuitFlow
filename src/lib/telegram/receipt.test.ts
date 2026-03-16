import { describe, expect, it } from 'vitest';
import { resolveReceiptTransaction } from '@/lib/telegram/receipt';

describe('telegram receipt helpers', () => {
  const wallets = [
    { id: 'wallet-cash', name: 'Cash' },
    { id: 'wallet-bca', name: 'BCA Debit' },
  ];

  const categories = [
    { id: 'cat-food', name: 'Food', type: 'expense' as const },
    { id: 'cat-salary', name: 'Salary', type: 'income' as const },
  ];

  it('matches wallet and category hints from the model output', () => {
    const resolved = resolveReceiptTransaction(
      {
        is_receipt: true,
        title: 'Kopi Kenangan',
        amount: 28500,
        type: 'expense',
        transaction_date: '2026-03-16',
        wallet_name: 'bca',
        category_name: 'food',
        confidence: 0.91,
      },
      {
        wallets,
        categories,
        timezone: 'Asia/Jakarta',
      }
    );

    expect(resolved).toMatchObject({
      isReceipt: true,
      title: 'Kopi Kenangan',
      amount: 28500,
      type: 'expense',
      transactionDate: '2026-03-16',
      walletId: 'wallet-bca',
      categoryId: 'cat-food',
    });
  });

  it('falls back to the only wallet when no wallet hint is available', () => {
    const resolved = resolveReceiptTransaction(
      {
        is_receipt: true,
        title: 'Monthly Salary',
        amount: '5000000',
        type: 'income',
        transaction_date: null,
        wallet_name: null,
        category_name: 'salary',
      },
      {
        wallets: [{ id: 'wallet-main', name: 'Main Wallet' }],
        categories,
        timezone: 'Asia/Jakarta',
      }
    );

    expect(resolved.walletId).toBe('wallet-main');
    expect(resolved.categoryId).toBe('cat-salary');
    expect(resolved.transactionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('respects explicit wallet and category overrides from the caption flow', () => {
    const resolved = resolveReceiptTransaction(
      {
        is_receipt: true,
        title: 'Family Mart',
        amount: 32000,
        type: 'expense',
        wallet_name: null,
        category_name: null,
      },
      {
        wallets,
        categories,
        timezone: 'Asia/Jakarta',
        walletIdOverride: 'wallet-cash',
        categoryIdOverride: 'cat-food',
      }
    );

    expect(resolved.walletId).toBe('wallet-cash');
    expect(resolved.categoryId).toBe('cat-food');
  });

  it('leaves wallet empty when there are multiple wallets and no match', () => {
    const resolved = resolveReceiptTransaction(
      {
        is_receipt: true,
        title: 'Restaurant Bill',
        amount: 150000,
        type: 'expense',
        wallet_name: null,
        category_name: null,
      },
      {
        wallets,
        categories,
        timezone: 'Asia/Jakarta',
      }
    );

    expect(resolved.walletId).toBeNull();
  });
});
