/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RetryButton } from './retry-button';

describe('RetryButton', () => {
  it('calls onRetry when clicked', async () => {
    const onRetry = jest.fn();
    const user = userEvent.setup();

    render(<RetryButton onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
