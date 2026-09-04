/** @jest-environment jsdom */
jest.mock('next/navigation', () => ({ usePathname: jest.fn(), useRouter: jest.fn() }));
jest.mock('@/components/auth/auth-context', () => ({ useAuth: jest.fn() }));

import { render, screen } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/components/auth/auth-context';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  beforeEach(() => {
    jest.mocked(usePathname).mockReturnValue('/invoices');
    jest.mocked(useRouter).mockReturnValue({ replace: jest.fn() } as never);
    jest.mocked(useAuth).mockReturnValue({ isLoading: false, login: jest.fn(), logout: jest.fn() });
  });

  it('renders a skip link targeting the main landmark', () => {
    render(<AppShell>content</AppShell>);

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
  });

  it('renders children inside the main landmark', () => {
    render(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });
});
