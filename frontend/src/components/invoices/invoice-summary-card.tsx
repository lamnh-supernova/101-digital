'use client';

import { useWatch, type Control } from 'react-hook-form';

import { Card } from '@/components/ui/card';
import { calculateInvoiceTotals } from '@/domain/invoice-money';
import { formatCurrency } from '@/lib/format-currency';
import type { CreateInvoiceFormValues } from '@/validation/create-invoice-form.schema';

export interface InvoiceSummaryCardProps {
  readonly control: Control<CreateInvoiceFormValues>;
}

export function InvoiceSummaryCard({ control }: InvoiceSummaryCardProps) {
  const values = useWatch({ control });
  const totals = calculateInvoiceTotals({
    quantity: values.item?.quantity ?? 0,
    rate: values.item?.rate ?? 0,
    taxPercent: values.taxPercent ?? 0,
    discount: values.discount ?? 0,
  });
  const currency = /^[A-Za-z]{3}$/.test(values.currency ?? '')
    ? (values.currency as string)
    : 'GBP';

  return (
    <Card aria-labelledby="summary-heading" className="p-5 sm:p-6">
      <h2 className="text-lg font-bold text-neutral-950" id="summary-heading">
        Calculated summary
      </h2>
      <p className="mt-1 text-sm text-neutral-600">
        The server independently recalculates these amounts before saving.
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        {(
          [
            ['Subtotal', totals.subTotal],
            ['Tax', totals.taxAmount],
            ['Discount', totals.discountAmount],
          ] as const
        ).map(([label, amount]) => (
          <div className="min-w-0" key={label}>
            <dt className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">{label}</dt>
            <dd className="mt-1 text-base font-semibold break-words text-neutral-950">
              {formatCurrency(amount, currency)}
            </dd>
          </div>
        ))}
        <div className="col-span-2 mt-1 border-t border-neutral-200 pt-4">
          <dt className="text-primary-700 text-xs font-semibold tracking-wide uppercase">
            Total amount
          </dt>
          <dd className="mt-1 text-2xl font-bold break-words text-neutral-950">
            {formatCurrency(totals.totalAmount, currency)}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
