/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

import type { Invoice, InvoicePage } from '@/domain/invoice-models';
import { DEFAULT_INVOICE_QUERY } from '@/validation/invoice-query.schema';

import { InvoiceTable } from './invoice-table';

const invoices: readonly Invoice[] = [
  {
    invoiceId: 'id-1',
    invoiceNumber: 'IV1000',
    invoiceDate: '2026-01-01',
    dueDate: '2026-02-01',
    currency: 'GBP',
    currencySymbol: '£',
    status: 'Overdue',
    invoiceSubTotal: 100,
    totalTax: 10,
    totalDiscount: 0,
    totalAmount: 110,
    totalPaid: 0,
    balanceAmount: 110,
    customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
    items: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const page: InvoicePage = {
  invoices,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 1,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  },
};

describe('InvoiceTable', () => {
  it('shows the customer name, formats the total, and shows the derived status', () => {
    render(<InvoiceTable page={page} query={DEFAULT_INVOICE_QUERY} />);

    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('£110.00')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('links each row to the invoice-scoped detail view by id', () => {
    render(<InvoiceTable page={page} query={DEFAULT_INVOICE_QUERY} />);

    expect(screen.getByRole('link', { name: /View invoice IV1000/ })).toHaveAttribute(
      'href',
      '/invoices?selected=id-1',
    );
  });

  it('toggles the sort direction via the sort-field header link', () => {
    render(<InvoiceTable page={page} query={DEFAULT_INVOICE_QUERY} />);

    const sortLink = screen.getByRole('link', { name: /Invoice date/ });
    expect(sortLink).toHaveAttribute('href', '/invoices?ordering=ASC');
  });
});
