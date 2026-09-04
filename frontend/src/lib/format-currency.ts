import { EMPTY_FORMATTED_VALUE } from './format-date';

const ISO_CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

export function formatCurrency(
  amount: number | null | undefined,
  currency: string,
  locale = 'en-GB',
): string {
  if (
    amount === null ||
    amount === undefined ||
    !Number.isFinite(amount) ||
    !ISO_CURRENCY_PATTERN.test(currency)
  ) {
    return EMPTY_FORMATTED_VALUE;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return EMPTY_FORMATTED_VALUE;
  }
}
