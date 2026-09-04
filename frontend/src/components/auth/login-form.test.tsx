/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('./auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';

import { LoginForm } from './login-form';
import { useAuth } from './auth-context';

const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);

describe('LoginForm', () => {
  let login: jest.Mock;
  let replace: jest.Mock;

  beforeEach(() => {
    login = jest.fn();
    replace = jest.fn();
    mockedUseRouter.mockReturnValue({ replace } as never);
    mockedUseAuth.mockReturnValue({ isLoading: false, login, logout: jest.fn() });
  });

  it('toggles the password field between hidden and visible text', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const password = screen.getByLabelText('Password', { exact: true });
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
  });

  it('shows a client-side validation error for an invalid email without calling login', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('submits valid credentials and redirects to /invoices on success', async () => {
    login.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'reviewer@simpleinvoice.test');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'ReviewerPass123!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(login).toHaveBeenCalledWith('reviewer@simpleinvoice.test', 'ReviewerPass123!');
    await waitFor(() => expect(replace).toHaveBeenCalledWith('/invoices'));
  });

  it('shows and focuses a form-level error summary on a failed submission', async () => {
    login.mockResolvedValue({ ok: false, message: 'The email or password is incorrect.' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'reviewer@simpleinvoice.test');
    await user.type(screen.getByLabelText('Password', { exact: true }), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('The email or password is incorrect.');
    expect(alert).toHaveFocus();
  });
});
