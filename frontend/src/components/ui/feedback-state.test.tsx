/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

import { EmptyState, ErrorState, LoadingState } from './feedback-state';

describe('feedback states', () => {
  it('renders a loading status region with default copy', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders an error alert with the given title', () => {
    render(<ErrorState title="Invoices could not be loaded" />);
    expect(screen.getByRole('alert', { name: 'Invoices could not be loaded' })).toBeInTheDocument();
  });

  it('renders an empty state heading without an implicit live region role', () => {
    render(<EmptyState title="No invoices yet" />);
    expect(screen.getByRole('heading', { name: 'No invoices yet' })).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('promotes the heading to h1 when requested', () => {
    render(<ErrorState headingLevel={1} title="We could not load this page" />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'We could not load this page' }),
    ).toBeInTheDocument();
  });
});
