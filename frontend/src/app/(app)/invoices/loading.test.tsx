/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';

import InvoiceLoading from './loading';

describe('InvoiceLoading', () => {
  it('renders a busy, polite live region while invoices are loading', () => {
    render(<InvoiceLoading />);

    const region = screen.getByRole('heading', { name: 'Loading invoices' }).closest('section');
    expect(region).toHaveAttribute('aria-busy', 'true');
    expect(region).toHaveAttribute('aria-live', 'polite');
  });
});
