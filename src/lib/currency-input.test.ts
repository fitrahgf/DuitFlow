import { describe, expect, it } from 'vitest';
import { getCurrencyLocale } from '@/lib/currency';
import {
  formatCurrencyInput,
  normalizeCurrencyInput,
  parseCurrencyInput,
} from '@/lib/currency-input';

describe('currency input helpers', () => {
  it('normalizes formatted and noisy values into raw digits', () => {
    expect(normalizeCurrencyInput('400.000')).toBe('400000');
    expect(normalizeCurrencyInput('Rp 1,250,000')).toBe('1250000');
    expect(normalizeCurrencyInput('0004500')).toBe('4500');
  });

  it('formats grouped values based on language locale', () => {
    expect(formatCurrencyInput('400000', getCurrencyLocale('id', 'IDR'))).toBe('400.000');
    expect(formatCurrencyInput('400000', getCurrencyLocale('en', 'USD'))).toBe('400,000');
  });

  it('parses raw values back to numbers', () => {
    expect(parseCurrencyInput('1.250.000')).toBe(1250000);
    expect(parseCurrencyInput('')).toBeUndefined();
  });
});
