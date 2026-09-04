export interface InvoiceTotals {
  readonly subTotal: number;
  readonly taxAmount: number;
  readonly discountAmount: number;
  readonly totalAmount: number;
  readonly balanceAmount: number;
}

export interface InvoiceTotalsInput {
  readonly quantity: number;
  readonly rate: number;
  readonly taxPercent: number;
  readonly discount: number;
  readonly totalPaid?: number;
}

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Server-side invoice math (never trust a client-submitted total):
 * subTotal = quantity x rate
 * taxAmount = subTotal x (tax% / 100)
 * totalAmount = subTotal + taxAmount - discount
 * balanceAmount = totalAmount - totalPaid
 */
export function calculateInvoiceTotals(input: InvoiceTotalsInput): InvoiceTotals {
  const subTotal = roundCurrency(input.quantity * input.rate);
  const taxAmount = roundCurrency(subTotal * (input.taxPercent / 100));
  const discountAmount = roundCurrency(input.discount);
  const totalAmount = roundCurrency(subTotal + taxAmount - discountAmount);
  const totalPaid = input.totalPaid ?? 0;
  const balanceAmount = roundCurrency(totalAmount - totalPaid);

  return { subTotal, taxAmount, discountAmount, totalAmount, balanceAmount };
}

export function currencySymbolFor(code: string): string {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const symbolPart = parts.find((part) => part.type === 'currency');
    return symbolPart?.value ?? code;
  } catch {
    return code;
  }
}
