import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import HistoryError from '../error';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

describe('History route error boundary (error.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the segment error UI without throwing', () => {
    render(<HistoryError error={new Error('boom')} reset={vi.fn()} />);
    expect(screen.getByText('Transaction History Error')).toBeTruthy();
    expect(screen.getByText('boom')).toBeTruthy();
  });

  it('reports the error to Sentry on mount', () => {
    const error = new Error('forced');
    render(<HistoryError error={error} reset={vi.fn()} />);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('calls reset when "Try again" is clicked', () => {
    const reset = vi.fn();
    render(<HistoryError error={new Error('x')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('offers a link back home', () => {
    render(<HistoryError error={new Error('x')} reset={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Go home' }).getAttribute('href')).toBe('/');
  });
});
