import type { Language } from '@/lib/i18n/dictionaries';

export interface CurrencyFormatOptions {
  currencyDisplay?: Intl.NumberFormatOptions['currencyDisplay'];
  maximumFractionDigits?: number;
  minimumFractionDigits?: number;
  signDisplay?: Intl.NumberFormatOptions['signDisplay'];
}

const DEFAULT_CURRENCY_CODE = 'IDR';
const currencyNames = {
  IDR: {
    en: 'Indonesian Rupiah',
    id: 'Rupiah Indonesia',
  },
  USD: {
    en: 'US Dollar',
    id: 'Dolar AS',
  },
  SGD: {
    en: 'Singapore Dollar',
    id: 'Dolar Singapura',
  },
} as const;

export const supportedCurrencyCodes = Object.keys(currencyNames) as Array<keyof typeof currencyNames>;

export function normalizeCurrencyCode(currencyCode?: string | null) {
  return currencyCode?.trim().toUpperCase() || DEFAULT_CURRENCY_CODE;
}

export function getCurrencyName(language: Language, currencyCode?: string | null) {
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) as keyof typeof currencyNames;
  return currencyNames[normalizedCurrencyCode]?.[language] ?? normalizedCurrencyCode;
}

export function getCurrencyLocale(language: Language, currencyCode?: string | null) {
  switch (normalizeCurrencyCode(currencyCode)) {
    case 'IDR':
      return 'id-ID';
    case 'USD':
      return 'en-US';
    case 'SGD':
      return 'en-SG';
    default:
      return language === 'id' ? 'id-ID' : 'en-US';
  }
}

export function formatCurrencyAmount(
  amount: number,
  language: Language,
  currencyCode?: string | null,
  options: CurrencyFormatOptions = {}
) {
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);

  return new Intl.NumberFormat(getCurrencyLocale(language, normalizedCurrencyCode), {
    style: 'currency',
    currency: normalizedCurrencyCode,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 0,
    currencyDisplay: options.currencyDisplay,
    signDisplay: options.signDisplay,
  }).format(amount);
}
