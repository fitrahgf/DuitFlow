import { describe, expect, it } from 'vitest';
import {
  buildSuggestionModel,
  suggestCategory,
  suggestWallet,
  tokenizeTitle,
  type SuggestionTransactionLike,
} from '@/lib/smartSuggest';

function buildTransactions(items: Array<Partial<SuggestionTransactionLike> & Pick<SuggestionTransactionLike, 'title' | 'type'>>) {
  return items.map((item, index) => ({
    title: item.title ?? null,
    type: item.type,
    category_id: item.category_id ?? null,
    wallet_id: item.wallet_id ?? null,
    transaction_date: item.transaction_date ?? `2026-03-${String(15 - index).padStart(2, '0')}`,
    created_at: item.created_at ?? `2026-03-${String(15 - index).padStart(2, '0')}T10:00:00.000Z`,
  })) satisfies SuggestionTransactionLike[];
}

describe('smartSuggest helpers', () => {
  it('tokenizes and removes amount-like tokens', () => {
    expect(tokenizeTitle('kopi 18rb rp idr', 'auto')).toEqual(['kopi']);
    expect(tokenizeTitle('salary 5jt bca', 'auto')).toEqual(['salary', 'bca']);
  });

  it('suggests a category based on similar recent titles', () => {
    const transactions = buildTransactions(
      Array.from({ length: 10 }, () => ({
        title: 'Starbucks',
        type: 'expense' as const,
        category_id: 'cat-food',
        wallet_id: 'wallet-cash',
        transaction_date: '2026-03-15',
      }))
    );

    const model = buildSuggestionModel(transactions, { now: new Date('2026-03-16T00:00:00.000Z') });
    const categoryLabels = {
      'cat-food': 'Food',
    };

    const suggestions = suggestCategory(model, 'starbucks 30k', 'expense', categoryLabels);
    expect(suggestions[0]).toMatchObject({ id: 'cat-food', label: 'Food' });
  });

  it('does not suggest when there is not enough history', () => {
    const transactions = buildTransactions(
      Array.from({ length: 9 }, () => ({
        title: 'Starbucks',
        type: 'expense' as const,
        category_id: 'cat-food',
        wallet_id: 'wallet-cash',
        transaction_date: '2026-03-15',
      }))
    );

    const model = buildSuggestionModel(transactions, { now: new Date('2026-03-16T00:00:00.000Z') });
    const categoryLabels = {
      'cat-food': 'Food',
    };

    expect(suggestCategory(model, 'starbucks', 'expense', categoryLabels)).toEqual([]);
  });

  it('scopes suggestions by transaction type', () => {
    const transactions = buildTransactions(
      Array.from({ length: 10 }, () => ({
        title: 'Salary ACME',
        type: 'income' as const,
        category_id: 'cat-salary',
        wallet_id: 'wallet-bank',
        transaction_date: '2026-03-15',
      }))
    );

    const model = buildSuggestionModel(transactions, { now: new Date('2026-03-16T00:00:00.000Z') });
    const categoryLabels = {
      'cat-salary': 'Salary',
    };

    expect(suggestCategory(model, 'salary acme', 'expense', categoryLabels)).toEqual([]);
  });

  it('prefers more recent matches via recency weighting', () => {
    const transactions = buildTransactions([
      ...Array.from({ length: 5 }, () => ({
        title: 'Coffee beans',
        type: 'expense' as const,
        category_id: 'cat-old',
        wallet_id: 'wallet-cash',
        transaction_date: '2025-12-01',
      })),
      ...Array.from({ length: 5 }, () => ({
        title: 'Coffee beans',
        type: 'expense' as const,
        category_id: 'cat-new',
        wallet_id: 'wallet-cash',
        transaction_date: '2026-03-15',
      })),
    ]);

    const model = buildSuggestionModel(transactions, { now: new Date('2026-03-16T00:00:00.000Z') });
    const categoryLabels = {
      'cat-old': 'Old category',
      'cat-new': 'New category',
    };

    const suggestions = suggestCategory(model, 'coffee beans', 'expense', categoryLabels);
    expect(suggestions[0]).toMatchObject({ id: 'cat-new' });
  });

  it('can suggest wallets using the same model', () => {
    const transactions = buildTransactions(
      Array.from({ length: 10 }, () => ({
        title: 'Lunch',
        type: 'expense' as const,
        category_id: 'cat-food',
        wallet_id: 'wallet-card',
        transaction_date: '2026-03-15',
      }))
    );

    const model = buildSuggestionModel(transactions, { now: new Date('2026-03-16T00:00:00.000Z') });
    const walletLabels = {
      'wallet-card': 'My Card',
    };

    const suggestions = suggestWallet(model, 'lunch', 'expense', walletLabels);
    expect(suggestions[0]).toMatchObject({ id: 'wallet-card', label: 'My Card' });
  });
});

