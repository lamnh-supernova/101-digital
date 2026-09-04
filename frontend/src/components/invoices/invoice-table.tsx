import { ArrowDown, ArrowUp } from 'lucide-react';
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

export interface InvoiceTableProps {
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

export function InvoiceTable({ page, query }: InvoiceTableProps) {
  const toggledOrder = query.ordering === 'DESC' ? 'ASC' : 'DESC';
  const SortIcon = query.ordering === 'DESC' ? ArrowDown : ArrowUp;
  const sortHref = invoiceQueryHref(
    withInvoiceQuery(query, { ordering: toggledOrder, page: 1, selected: undefined }),
  );

  return (
    <div className="hidden max-w-full overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-neutral-950/5 lg:block">
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">Invoices for the selected search and filter state</caption>
        <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-600 uppercase">
          <tr>
            <th className="w-1/4 px-4 py-3 font-semibold" scope="col">
              Invoice
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Customer
            </th>
            <th
              aria-sort={query.ordering === 'DESC' ? 'descending' : 'ascending'}
              className="w-52 px-4 py-3 font-semibold"
              scope="col"
            >
              <Link
                className="focus-visible:ring-primary-600 inline-flex items-center gap-1.5 rounded-sm underline decoration-neutral-300 underline-offset-4 focus-visible:ring-2 focus-visible:outline-none"
                href={sortHref}
              >
                {query.sortBy === 'dueDate'
                  ? 'Due date'
                  : query.sortBy === 'totalAmount'
                    ? 'Total'
                    : 'Invoice date'}
                <SortIcon aria-hidden="true" className="text-primary-700 size-3.5" />
                <span className="sr-only">
                  , currently sorted {query.ordering === 'DESC' ? 'descending' : 'ascending'};
                  activate to sort {toggledOrder === 'DESC' ? 'descending' : 'ascending'}
                </span>
              </Link>
            </th>
            <th className="w-40 px-4 py-3 text-right font-semibold" scope="col">
              Amount
            </th>
            <th className="w-28 px-4 py-3 font-semibold" scope="col">
              Status
            </th>
            <th className="w-24 px-4 py-3 text-right font-semibold" scope="col">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {page.invoices.map((invoice) => (
            <tr className="text-neutral-700" key={invoice.invoiceId}>
              <th className="px-4 py-4 font-semibold text-neutral-950" scope="row">
                <span className="block break-all">{invoice.invoiceNumber}</span>
                {invoice.invoiceReference ? (
                  <span className="mt-1 block text-xs font-normal break-all text-neutral-500">
                    {invoice.invoiceReference}
                  </span>
                ) : null}
              </th>
              <td className="px-4 py-4 break-all">{invoice.customer.fullname}</td>
              <td className="px-4 py-4 whitespace-nowrap">
                {formatDate(query.sortBy === 'dueDate' ? invoice.dueDate : invoice.invoiceDate)}
              </td>
              <td className="px-4 py-4 text-right font-medium whitespace-nowrap text-neutral-950">
                {formatCurrency(invoice.totalAmount, invoice.currency)}
              </td>
              <td className="px-4 py-4">
                <Badge tone={STATUS_TONE[invoice.status]}>{invoice.status}</Badge>
              </td>
              <td className="px-4 py-4 text-right">
                <Link
                  className="text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-600 inline-flex min-h-10 items-center rounded-md px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none"
                  data-invoice-view={invoice.invoiceId}
                  href={viewHref(query, invoice)}
                >
                  View <span className="sr-only">invoice {invoice.invoiceNumber}</span>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
