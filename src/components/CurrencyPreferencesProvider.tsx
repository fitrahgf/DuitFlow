'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useLanguage } from '@/components/LanguageProvider';
import {
  formatCurrencyAmount,
  getCurrencyLocale,
  normalizeCurrencyCode,
  type CurrencyFormatOptions,
} from '@/lib/currency';

interface CurrencyPreferencesContextValue {
  currencyCode: string;
  formatCurrency: (amount: number, options?: CurrencyFormatOptions) => string;
  locale: string;
}

const CurrencyPreferencesContext = createContext<CurrencyPreferencesContextValue | undefined>(undefined);

export function CurrencyPreferencesProvider({
  children,
  currencyCode,
}: {
  children: ReactNode;
  currencyCode?: string | null;
}) {
  const { language } = useLanguage();
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode);

  const value = useMemo<CurrencyPreferencesContextValue>(() => {
    const locale = getCurrencyLocale(language, normalizedCurrencyCode);

    return {
      currencyCode: normalizedCurrencyCode,
      locale,
      formatCurrency: (amount, options) =>
        formatCurrencyAmount(amount, language, normalizedCurrencyCode, options),
    };
  }, [language, normalizedCurrencyCode]);

  return (
    <CurrencyPreferencesContext.Provider value={value}>
      {children}
    </CurrencyPreferencesContext.Provider>
  );
}

export function useCurrencyPreferences() {
  const context = useContext(CurrencyPreferencesContext);

  if (!context) {
    throw new Error('useCurrencyPreferences must be used within a CurrencyPreferencesProvider');
  }

  return context;
}
