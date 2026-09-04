import Link from 'next/link';

import { Badge, type BadgeTone } from '@/components/ui/badge';
import type {
  DisplayInvoiceStatus,
  Invoice,
  InvoiceListQuery,
  InvoicePage,
} from '@/domain/invoice-models';
import { formatCurrency } from '@/lib/format-currency';
import { formatDate } from '@/lib/format-date';
import { invoiceQueryHref, withInvoiceQuery } from '@/validation/invoice-query.schema';

export interface InvoiceCardsProps {
  readonly page: InvoicePage;
  readonly query: InvoiceListQuery;
}

const STATUS_TONE: Readonly<Record<DisplayInvoiceStatus, BadgeTone>> = {
  Draft: 'neutral',
  Pending: 'warning',
  Paid: 'success',
  Overdue: 'danger',
};

function viewHref(query: InvoiceListQuery, invoice: Invoice): string {
  return invoiceQueryHref(withInvoiceQuery(query, { selected: invoice.invoiceId }));
}

export function InvoiceCards({ page, query }: InvoiceCardsProps) {
  return (
    <ul aria-label="Invoices" className="grid gap-4 sm:grid-cols-2 lg:hidden">
      {page.invoices.map((invoice) => (
        <li
          className="min-w-0 rounded-lg bg-white p-5 shadow-md ring-1 ring-neutral-950/5"
          key={invoice.invoiceId}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold break-all text-neutral-950">{invoice.invoiceNumber}</p>
              <p className="mt-1 text-sm break-all text-neutral-600">{invoice.customer.fullname}</p>
            </div>
            <div className="shrink-0">
              <Badge tone={STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
            </div>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="min-w-0">
              <dt className="text-xs font-medium text-neutral-500">Invoice date</dt>
              <dd className="mt-1 text-neutral-800">{formatDate(invoice.invoiceDate)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-medium text-neutral-500">Amount</dt>
              <dd className="mt-1 font-semibold text-neutral-950">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </dd>
            </div>
          </dl>
          <Link
            className="focus-visible:ring-primary-600 mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-neutral-950 px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            data-invoice-view={invoice.invoiceId}
            href={viewHref(query, invoice)}
          >
            View invoice <span className="sr-only">{invoice.invoiceNumber}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
