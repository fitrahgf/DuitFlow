import { describe, expect, it } from 'vitest';
import {
  parseNotificationsUrlState,
  parseReportsUrlState,
  parseTransactionUrlState,
  serializeNotificationsUrlState,
  serializeReportsUrlState,
  serializeTransactionUrlState,
  transactionUrlStateToFilters,
} from '@/lib/url-state';

describe('url-state helpers', () => {
  it('normalizes invalid transaction query params', () => {
    const state = parseTransactionUrlState(
      new URLSearchParams(
        'q= coffee &type=weird&period=custom&from=invalid&to=2026-03-16&source=nope&min=1.200.000&sort=bad'
      )
    );

    expect(state).toEqual({
      q: 'coffee',
      type: 'all',
      wallet: '',
      category: '',
      source: 'all',
      period: 'custom',
      from: '',
      to: '2026-03-16',
      min: '1200000',
      max: '',
      sort: 'newest',
    });

    expect(transactionUrlStateToFilters(state)).toMatchObject({
      search: 'coffee',
      minAmount: '1200000',
      customTo: '2026-03-16',
    });
  });

  it('serializes transaction query params without defaults', () => {
    const query = serializeTransactionUrlState({
      q: 'salary',
      type: 'income',
      wallet: 'wallet-1',
      category: '',
      source: 'manual',
      period: 'custom',
      from: '2026-03-01',
      to: '2026-03-31',
      min: '100000',
      max: '',
      sort: 'highest',
    });

    expect(query).toBe(
      'q=salary&type=income&wallet=wallet-1&source=manual&period=custom&from=2026-03-01&to=2026-03-31&min=100000&sort=highest'
    );
  });

  it('round-trips reports url state and strips invalid dates', () => {
    const parsed = parseReportsUrlState(
      new URLSearchParams('period=custom&wallet=w1&category=c1&from=2026-03-01&to=nope&keyword= lunch ')
    );

    expect(parsed).toEqual({
      period: 'custom',
      wallet: 'w1',
      category: 'c1',
      from: '2026-03-01',
      to: '',
      keyword: 'lunch',
    });

    expect(serializeReportsUrlState(parsed)).toBe(
      'period=custom&wallet=w1&category=c1&from=2026-03-01&keyword=lunch'
    );
  });

  it('serializes notifications url state without defaults', () => {
    const parsed = parseNotificationsUrlState(new URLSearchParams('scope=unread&type=budget_warning'));

    expect(parsed).toEqual({
      scope: 'unread',
      type: 'budget_warning',
    });

    expect(serializeNotificationsUrlState(parsed)).toBe('scope=unread&type=budget_warning');
  });
});
