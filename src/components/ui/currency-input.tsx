'use client';

import * as React from 'react';
import { useCurrencyPreferences } from '@/components/CurrencyPreferencesProvider';
import {
  formatCurrencyInput,
  normalizeCurrencyInput,
  parseCurrencyInput,
} from '@/lib/currency-input';
import { Input } from '@/components/ui/input';

type CurrencyInputValue = unknown;

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value?: CurrencyInputValue;
  defaultValue?: CurrencyInputValue;
  locale?: string;
  onValueChange?: (value: string) => void;
  onNumberValueChange?: (value: number | undefined) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      defaultValue,
      locale,
      inputMode = 'numeric',
      onValueChange,
      onNumberValueChange,
      ...props
    },
    ref
  ) => {
    const { locale: preferredLocale } = useCurrencyPreferences();
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() =>
      normalizeCurrencyInput(defaultValue)
    );

    React.useEffect(() => {
      if (!isControlled) {
        setInternalValue(normalizeCurrencyInput(defaultValue));
      }
    }, [defaultValue, isControlled]);

    const rawValue = isControlled ? normalizeCurrencyInput(value) : internalValue;
    const displayValue = formatCurrencyInput(rawValue, locale ?? preferredLocale);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextRawValue = normalizeCurrencyInput(event.target.value);

      if (!isControlled) {
        setInternalValue(nextRawValue);
      }

      onValueChange?.(nextRawValue);
      onNumberValueChange?.(parseCurrencyInput(nextRawValue));
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
