/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));
jest.mock('@/components/auth/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-context';

import { SidebarNav } from './sidebar-nav';

const mockedUsePathname = jest.mocked(usePathname);
const mockedUseRouter = jest.mocked(useRouter);
const mockedUseAuth = jest.mocked(useAuth);

describe('SidebarNav', () => {
  beforeEach(() => {
    mockedUsePathname.mockReturnValue('/invoices');
    mockedUseRouter.mockReturnValue({ replace: jest.fn() } as never);
  });

  it('renders nothing when signed out', () => {
    mockedUseAuth.mockReturnValue({ isLoading: false, login: jest.fn(), logout: jest.fn() });
    const { container } = render(<SidebarNav />);

    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current section with aria-current when signed in', () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'a@example.test', fullname: 'A' },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    render(<SidebarNav />);

    expect(
      screen.getAllByRole('link', { name: /Invoices/ })[0],
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getAllByRole('link', { name: /New invoice/ })[0],
    ).not.toHaveAttribute('aria-current');
  });

  it('signs out and redirects to /login', async () => {
    const logout = jest.fn();
    const replace = jest.fn();
    mockedUseRouter.mockReturnValue({ replace } as never);
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'a@example.test', fullname: 'A' },
      isLoading: false,
      login: jest.fn(),
      logout,
    });
    const user = userEvent.setup();
    render(<SidebarNav />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(logout).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('opens and closes the mobile menu', async () => {
    mockedUseAuth.mockReturnValue({
      user: { id: '1', email: 'a@example.test', fullname: 'A' },
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
    });
    const user = userEvent.setup();
    render(<SidebarNav />);

    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );

    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
