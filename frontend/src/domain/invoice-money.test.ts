import { calculateInvoiceTotals } from './invoice-money';

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
    });
  });

  it('treats a non-finite or negative input as zero rather than throwing', () => {
    expect(
      calculateInvoiceTotals({ quantity: Number.NaN, rate: -5, taxPercent: 10, discount: 0 }),
    ).toEqual({ subTotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 });
  });

  it('never lets a large discount push the total below zero', () => {
    const totals = calculateInvoiceTotals({
      quantity: 1,
      rate: 10,
      taxPercent: 0,
      discount: 1000,
    });

    expect(totals.totalAmount).toBe(0);
  });
});
