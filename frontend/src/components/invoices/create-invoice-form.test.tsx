/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('@/components/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('@/lib/api-client', () => {
  const actual = jest.requireActual('@/lib/api-client');
  return { ...actual, apiRequest: jest.fn() };
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-context';
import { ApiError, apiRequest } from '@/lib/api-client';

import { CreateInvoiceForm } from './create-invoice-form';

const mockedApiRequest = jest.mocked(apiRequest);
const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.type(screen.getByLabelText('Invoice number'), 'IV-100');
  fireEvent.change(screen.getByLabelText('Invoice date'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByLabelText('Due date'), { target: { value: '2026-02-01' } });
  await user.type(screen.getByLabelText('Customer name'), 'Alex Morgan');
  await user.type(screen.getByLabelText('Customer email'), 'alex@example.test');
  await user.type(screen.getByLabelText('Item name'), 'Consulting');
  await user.type(screen.getByLabelText('Rate'), '125.5');
}

describe('CreateInvoiceForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseRouter.mockReturnValue({ replace: jest.fn() } as never);
    mockedUseAuth.mockReturnValue({
      accessToken: 'TEST_ONLY_TOKEN',
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it('blocks submission of an empty form and shows a summary error', async () => {
    const user = userEvent.setup();
    render(<CreateInvoiceForm />);

    await user.click(screen.getByRole('button', { name: 'Review and create invoice' }));

    expect(
      await screen.findByText('Check the highlighted fields and submit the invoice again.'),
    ).toBeInTheDocument();
    expect(mockedApiRequest).not.toHaveBeenCalled();
  });

  it('recalculates the live summary as the rate changes', async () => {
    const user = userEvent.setup();
    render(<CreateInvoiceForm />);

    await user.type(screen.getByLabelText('Rate'), '125.5');

    expect((await screen.findAllByText('£138.05'))[0]).toBeInTheDocument();
  });

  it('submits once and shows a success message linking back to the invoice list', async () => {
    mockedApiRequest.mockResolvedValue({ invoiceNumber: 'IV-100' });
    const user = userEvent.setup();
    render(<CreateInvoiceForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Review and create invoice' }));

    expect(await screen.findByText('Invoice IV-100 was created.')).toBeInTheDocument();
    expect(mockedApiRequest).toHaveBeenCalledTimes(1);
    expect(mockedApiRequest).toHaveBeenCalledWith(
      '/invoices',
      expect.objectContaining({ method: 'POST', token: 'TEST_ONLY_TOKEN' }),
    );
  });

  it('shows a conflict message for a duplicate invoice number', async () => {
    mockedApiRequest.mockRejectedValue(
      new ApiError(
        409,
        { message: 'Invoice number already exists' },
        'Invoice number already exists',
      ),
    );
    const user = userEvent.setup();
    render(<CreateInvoiceForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Review and create invoice' }));

    expect(
      await screen.findByText('That invoice number may already exist. Review it and try again.'),
    ).toBeInTheDocument();
  });

  it('redirects to sign-in when the session has expired', async () => {
    mockedApiRequest.mockRejectedValue(new ApiError(401, undefined, 'Unauthorized'));
    const logout = jest.fn();
    const replace = jest.fn();
    mockedUseRouter.mockReturnValue({ replace } as never);
    mockedUseAuth.mockReturnValue({
      accessToken: 'TEST_ONLY_TOKEN',
      isLoading: false,
      login: jest.fn(),
      logout,
    });
    const user = userEvent.setup();
    render(<CreateInvoiceForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Review and create invoice' }));

    await waitFor(() => expect(logout).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith('/login');
  });
});
