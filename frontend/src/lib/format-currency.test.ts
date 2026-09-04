import { EMPTY_FORMATTED_VALUE } from './format-date';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
  it('formats a positive amount with its currency symbol', () => {
    expect(formatCurrency(1250.5, 'GBP')).toBe('£1,250.50');
  });

  it('normalizes a lowercase currency code', () => {
    expect(formatCurrency(10, 'gbp')).toBe('£10.00');
  });

  it('returns the empty-value placeholder for a missing amount', () => {
    expect(formatCurrency(null, 'GBP')).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatCurrency(undefined, 'GBP')).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatCurrency(Number.NaN, 'GBP')).toBe(EMPTY_FORMATTED_VALUE);
  });

  it('returns the empty-value placeholder for a currency that fails the three-letter gate', () => {
    expect(formatCurrency(10, '')).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatCurrency(10, 'GB')).toBe(EMPTY_FORMATTED_VALUE);
    expect(formatCurrency(10, 'NOTREAL')).toBe(EMPTY_FORMATTED_VALUE);
  });
});
