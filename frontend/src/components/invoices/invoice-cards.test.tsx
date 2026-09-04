/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

import type { Invoice, InvoicePage } from '@/domain/invoice-models';
import { DEFAULT_INVOICE_QUERY } from '@/validation/invoice-query.schema';

import { InvoiceCards } from './invoice-cards';

const invoices: readonly Invoice[] = [
  {
    invoiceId: 'id-1',
    invoiceNumber: 'IV1000',
    invoiceDate: '2026-01-01',
    dueDate: '2026-02-01',
    currency: 'GBP',
    currencySymbol: '£',
    status: 'Paid',
    invoiceSubTotal: 100,
    totalTax: 10,
    totalDiscount: 0,
    totalAmount: 110,
    totalPaid: 110,
    balanceAmount: 0,
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

describe('InvoiceCards', () => {
  it('renders a labelled list with a card per invoice', () => {
    render(<InvoiceCards page={page} query={DEFAULT_INVOICE_QUERY} />);

    expect(screen.getByRole('list', { name: 'Invoices' })).toBeInTheDocument();
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument();
    expect(screen.getByText('£110.00')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('links the card to the invoice-scoped detail view by id', () => {
    render(<InvoiceCards page={page} query={DEFAULT_INVOICE_QUERY} />);

    expect(screen.getByRole('link', { name: /View invoice IV1000/ })).toHaveAttribute(
      'href',
      '/invoices?selected=id-1',
    );
  });
});
