/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { DEFAULT_INVOICE_QUERY } from '@/validation/invoice-query.schema';

import { InvoiceFilters } from './invoice-filters';

const mockedUseRouter = jest.mocked(useRouter);

describe('InvoiceFilters', () => {
  let replace: jest.Mock;

  beforeEach(() => {
    replace = jest.fn();
    mockedUseRouter.mockReturnValue({ replace } as never);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('debounces the keyword search before navigating', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<InvoiceFilters query={DEFAULT_INVOICE_QUERY} />);

    await user.type(
      screen.getByRole('searchbox', { name: 'Search invoice number or customer' }),
      'IV1000',
    );
    expect(replace).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(350);
    expect(replace).toHaveBeenCalledWith('/invoices?keyword=IV1000', { scroll: false });
  });

  it('navigates immediately when the status filter changes', async () => {
    const user = userEvent.setup();
    render(<InvoiceFilters query={DEFAULT_INVOICE_QUERY} />);

    await user.selectOptions(screen.getByLabelText('Status'), 'Overdue');

    expect(replace).toHaveBeenCalledWith('/invoices?status=Overdue', { scroll: false });
  });

  it('navigates immediately when the sort field changes', async () => {
    const user = userEvent.setup();
    render(<InvoiceFilters query={DEFAULT_INVOICE_QUERY} />);

    await user.selectOptions(screen.getByLabelText('Sort by'), 'totalAmount');

    expect(replace).toHaveBeenCalledWith('/invoices?sortBy=totalAmount', { scroll: false });
  });

  it('rejects an inverted date range without navigating', async () => {
    const user = userEvent.setup();
    render(<InvoiceFilters query={DEFAULT_INVOICE_QUERY} />);

    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-01-01' } });
    await user.click(screen.getByRole('button', { name: 'Apply dates' }));

    expect(
      await screen.findByText('The from date must not be after the to date.'),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('disables Clear with no active filters and enables it once a filter is set', () => {
    const { rerender } = render(<InvoiceFilters query={DEFAULT_INVOICE_QUERY} />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();

    rerender(<InvoiceFilters query={{ ...DEFAULT_INVOICE_QUERY, keyword: 'IV1000' }} />);
    expect(screen.getByRole('button', { name: 'Clear' })).toBeEnabled();
  });
});
