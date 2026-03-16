import { describe, expect, it } from 'vitest';
import {
  formatCurrencyAmount,
  getCurrencyLocale,
  getCurrencyName,
  normalizeCurrencyCode,
  supportedCurrencyCodes,
} from '@/lib/currency';

describe('currency helpers', () => {
  it('normalizes currency codes', () => {
    expect(normalizeCurrencyCode('usd')).toBe('USD');
    expect(normalizeCurrencyCode(undefined)).toBe('IDR');
  });

  it('resolves locale from currency code first', () => {
    expect(getCurrencyLocale('en', 'IDR')).toBe('id-ID');
    expect(getCurrencyLocale('id', 'USD')).toBe('en-US');
    expect(getCurrencyLocale('id', 'SGD')).toBe('en-SG');
  });

  it('formats money with the current currency code', () => {
    expect(formatCurrencyAmount(400000, 'id', 'IDR').replace(/\s/g, '')).toBe('Rp400.000');
    expect(formatCurrencyAmount(400000, 'id', 'USD').replace(/\s/g, '')).toBe('$400,000');
  });

  it('returns localized currency metadata', () => {
    expect(supportedCurrencyCodes).toEqual(['IDR', 'USD', 'SGD']);
    expect(getCurrencyName('en', 'USD')).toBe('US Dollar');
    expect(getCurrencyName('id', 'SGD')).toBe('Dolar Singapura');
  });
});
