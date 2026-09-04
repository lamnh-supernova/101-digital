export interface InvoiceTotals {
  readonly subTotal: number;
  readonly taxAmount: number;
  readonly discountAmount: number;
  readonly totalAmount: number;
}

export interface InvoiceTotalsInput {
  readonly quantity: number;
  readonly rate: number;
  readonly taxPercent: number;
  readonly discount: number;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Client-side preview only; the server independently recomputes and
 * persists the authoritative totals using the same documented formula.
 */
export function calculateInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const quantity = Number.isFinite(input.quantity) ? input.quantity : 0;
  const rate = Number.isFinite(input.rate) ? input.rate : 0;
  const taxPercent = Number.isFinite(input.taxPercent) ? input.taxPercent : 0;
  const discount = Number.isFinite(input.discount) ? input.discount : 0;

  const subTotal = roundCurrency(Math.max(0, quantity) * Math.max(0, rate));
  const taxAmount = roundCurrency(subTotal * (Math.max(0, taxPercent) / 100));
  const discountAmount = roundCurrency(Math.max(0, discount));
  const totalAmount = Math.max(0, roundCurrency(subTotal + taxAmount - discountAmount));

  return { subTotal, taxAmount, discountAmount, totalAmount };
}
