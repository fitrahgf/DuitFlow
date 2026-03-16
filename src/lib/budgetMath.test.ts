import { describe, expect, it } from 'vitest';
import { getBudgetTone, summarizeBudgetUsage } from '@/lib/budgetMath';

describe('budgetMath helpers', () => {
  it('marks a budget as warning near the threshold', () => {
    const summary = summarizeBudgetUsage(
      [{ category_id: null, total_limit: 1000000 }],
      [{ amount: 850000, category_id: 'food' }]
    );

    expect(summary).toMatchObject({
      overallLimit: 1000000,
      overallSpent: 850000,
      remaining: 150000,
      ratio: 0.85,
      tone: 'warning',
    });
  });

  it('aggregates category budgets when there is no global budget', () => {
    const summary = summarizeBudgetUsage(
      [
        { category_id: 'food', amount_limit: 400000 },
        { category_id: 'transport', amount_limit: 200000 },
      ],
      [
        { amount: 250000, category_id: 'food' },
        { amount: 100000, category_id: 'transport' },
        { amount: 90000, category_id: 'shopping' },
      ]
    );

    expect(summary.overallLimit).toBe(600000);
    expect(summary.overallSpent).toBe(350000);
    expect(summary.remaining).toBe(250000);
  });

  it('returns danger when the ratio exceeds the limit', () => {
    expect(getBudgetTone(1.01)).toBe('danger');
  });
});
