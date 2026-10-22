import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RightPanel from '../../RightPanel';

vi.mock('@/hooks/useFxRate', () => ({
  useFxRate: () => ({ rate: null, flash: false }),
}));

const baseProps = {
  quote: { destinationAmount: '150000', rate: 1500, currency: 'NGN' },
  isConnected: true,
  isConnecting: false,
  isLoadingQuote: false,
  amount: '100',
  currency: 'NGN',
  onConnect: vi.fn(),
};

describe('RightPanel state ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // CollapsibleSection persists its open state in localStorage, so isolate each test.
    localStorage.clear();
  });

  it('derives the rendered payout entirely from props', () => {
    const { rerender } = render(<RightPanel {...baseProps} />);
    expect(screen.getAllByText(/150,000/).length).toBeGreaterThan(0);

    rerender(
      <RightPanel
        {...baseProps}
        amount="10"
        quote={{ destinationAmount: '15000', rate: 1500, currency: 'NGN' }}
      />,
    );
    expect(screen.getAllByText(/15,000/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/150,000/)).not.toBeInTheDocument();
  });

  it('keeps the only open/close state inside the Advanced Options section', () => {
    render(<RightPanel {...baseProps} />);

    const toggle = screen.getByRole('button', { name: /advanced options/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Allbridge')).toBeInTheDocument();
  });

  it('does not reset the advanced section when parent props change', () => {
    const { rerender } = render(<RightPanel {...baseProps} />);
    const toggle = screen.getByRole('button', { name: /advanced options/i });
    fireEvent.click(toggle);

    rerender(<RightPanel {...baseProps} amount="250" />);
    expect(screen.getByRole('button', { name: /advanced options/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });
});
