import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as Sentry from '@sentry/react';
import { ErrorBoundary } from '../ErrorBoundary';
import { logger } from '@/lib/logger';

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(() => 'event-123'),
  showReportDialog: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('Bomb went off');
  return <div>Recovered content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = true;
    vi.clearAllMocks();
    // React logs caught errors to console.error; silence them for clean output.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary>
        <div>Healthy child</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Healthy child')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('renders the default fallback with the error message', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Bomb went off')).toBeTruthy();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('captures the error in Sentry and logs it', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Bomb went off' }),
      expect.objectContaining({
        extra: expect.objectContaining({ componentStack: expect.any(String) }),
      }),
    );
    expect(logger.error).toHaveBeenCalledWith(
      'ErrorBoundary',
      expect.objectContaining({ componentStack: expect.any(String) }),
      expect.objectContaining({ message: 'Bomb went off' }),
    );
  });

  it('calls onError with the error and component info', () => {
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toEqual(expect.objectContaining({ message: 'Bomb went off' }));
  });

  it('resets and re-renders children when "Try again" is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    rerender(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered content')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows "Report issue" only when Sentry returned an event id, and opens the dialog', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Report issue' }));
    expect(Sentry.showReportDialog).toHaveBeenCalledWith({ eventId: 'event-123' });
  });

  it('hides "Report issue" when Sentry returns no event id', () => {
    vi.mocked(Sentry.captureException).mockReturnValueOnce(undefined as unknown as string);
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.queryByRole('button', { name: 'Report issue' })).toBeNull();
  });
});
