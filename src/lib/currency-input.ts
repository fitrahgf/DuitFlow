export function sanitizeCurrencyInput(value: string) {
  const digits = value.replace(/[^\d]/g, '');

  if (!digits) {
    return '';
  }

  return digits.replace(/^0+(?=\d)/, '');
}

export function normalizeCurrencyInput(value: unknown) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return '';
    }

    return sanitizeCurrencyInput(String(Math.trunc(value)));
  }

  return sanitizeCurrencyInput(String(value ?? ''));
}

export function parseCurrencyInput(value: unknown) {
  const normalized = normalizeCurrencyInput(value);
  return normalized ? Number(normalized) : undefined;
}

export function formatCurrencyInput(
  value: unknown,
  locale: string
) {
  const normalized = normalizeCurrencyInput(value);

  if (!normalized) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Number(normalized));
}
