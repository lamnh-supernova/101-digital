import { calculateInvoiceTotals, currencySymbolFor } from './invoice-money';

describe('calculateInvoiceTotals', () => {
  it('computes subtotal, tax, and total using the documented formula', () => {
    const totals = calculateInvoiceTotals({
      quantity: 2,
      rate: 1000,
      taxPercent: 10,
      discount: 20,
    });

    expect(totals).toEqual({
      subTotal: 2000,
      taxAmount: 200,
      discountAmount: 20,
      totalAmount: 2180,
      balanceAmount: 2180,
    });
  });

  it('subtracts totalPaid to derive the outstanding balance', () => {
    const totals = calculateInvoiceTotals({
      quantity: 1,
      rate: 100,
      taxPercent: 0,
      discount: 0,
      totalPaid: 40,
    });

    expect(totals.balanceAmount).toBe(60);
  });

  it('defaults totalPaid to zero when omitted', () => {
    const totals = calculateInvoiceTotals({ quantity: 1, rate: 100, taxPercent: 10, discount: 0 });
    expect(totals.balanceAmount).toBe(totals.totalAmount);
  });

  it('rounds every amount to two decimal places', () => {
    const totals = calculateInvoiceTotals({
      quantity: 3,
      rate: 33.333,
      taxPercent: 7.5,
      discount: 0,
    });

    for (const amount of Object.values(totals)) {
      expect(Number.isInteger(Math.round(amount * 100))).toBe(true);
    }
  });
});

describe('currencySymbolFor', () => {
  it('resolves a known ISO currency code to a display symbol', () => {
    expect(currencySymbolFor('GBP')).toBe('£');
    expect(currencySymbolFor('USD')).toBe('$');
  });

  it('falls back to the code itself for a malformed currency code', () => {
    expect(currencySymbolFor('not-a-code')).toBe('not-a-code');
  });
});
