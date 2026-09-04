/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/components/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return { ...actual, apiRequest: jest.fn() };
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-context';
import type { Invoice } from '@/domain/invoice-models';
import { ApiError, apiRequest } from '@/lib/api-client';

import { InvoiceDetailDrawer } from './invoice-detail-drawer';

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);
const mockedApiRequest = jest.mocked(apiRequest);

const invoice: Invoice = {
  invoiceId: 'id-1',
  invoiceNumber: 'IV1000',
  invoiceDate: '2026-01-01',
  dueDate: '2026-02-01',
  currency: 'GBP',
  currencySymbol: '£',
  status: 'Draft',
  invoiceSubTotal: 100,
  totalTax: 10,
  totalDiscount: 0,
  totalAmount: 110,
  totalPaid: 0,
  balanceAmount: 110,
  customer: { fullname: 'Alex Morgan', email: 'alex@example.test' },
  items: [{ id: 'item-1', name: 'Consulting', quantity: 1, rate: 100 }],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('InvoiceDetailDrawer', () => {
  let replace: jest.Mock;
  let logout: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    replace = jest.fn();
    logout = jest.fn();
    mockedUseRouter.mockReturnValue({ replace } as never);
    mockedUseAuth.mockReturnValue({
      accessToken: 'TEST_ONLY_TOKEN',
      isLoading: false,
      login: jest.fn(),
      logout,
    });
  });

  it('fetches and renders the invoice, focusing the heading once loaded', async () => {
    mockedApiRequest.mockResolvedValue(invoice);
    render(<InvoiceDetailDrawer closeHref="/invoices" invoiceId="id-1" />);

    expect(await screen.findByRole('heading', { name: 'IV1000' })).toHaveFocus();
    expect(mockedApiRequest).toHaveBeenCalledWith('/invoices/id-1', { token: 'TEST_ONLY_TOKEN' });
  });

  it('shows an error state when the invoice cannot be found', async () => {
    mockedApiRequest.mockRejectedValue(new ApiError(404, undefined, 'Not found'));
    render(<InvoiceDetailDrawer closeHref="/invoices" invoiceId="missing" />);

    expect(await screen.findByText('This invoice could not be found.')).toBeInTheDocument();
  });

  it('logs out and redirects to sign-in on a 401', async () => {
    mockedApiRequest.mockRejectedValue(new ApiError(401, undefined, 'Unauthorized'));
    render(<InvoiceDetailDrawer closeHref="/invoices" invoiceId="id-1" />);

    await screen.findByRole('dialog');
    expect(logout).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('closes and restores focus to the triggering link on Escape', async () => {
    document.body.innerHTML = '<a href="#" data-invoice-view="id-1">View invoice IV1000</a>';
    const trigger = screen.getByRole('link', { name: 'View invoice IV1000' });
    mockedApiRequest.mockResolvedValue(invoice);

    render(<InvoiceDetailDrawer closeHref="/invoices" invoiceId="id-1" />);
    await screen.findByRole('heading', { name: 'IV1000' });

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(replace).toHaveBeenCalledWith('/invoices', { scroll: false });
    expect(trigger).toHaveFocus();
  });

  it('closes when the backdrop is clicked', async () => {
    mockedApiRequest.mockResolvedValue(invoice);
    const user = userEvent.setup();
    render(<InvoiceDetailDrawer closeHref="/invoices" invoiceId="id-1" />);
    await screen.findByRole('heading', { name: 'IV1000' });

    await user.click(screen.getByRole('button', { name: 'Close invoice details' }));

    expect(replace).toHaveBeenCalledWith('/invoices', { scroll: false });
  });
});
