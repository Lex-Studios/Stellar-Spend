import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AsyncBoundary, ListErrorState } from '../AsyncBoundary';

describe('AsyncBoundary error fallback and retry', () => {
  it('renders the default error state with the error message', () => {
    render(
      <AsyncBoundary
        isLoading={false}
        isEmpty={false}
        error="Network down"
        errorContent={(err) => <ListErrorState error={err} />}
      >
        <div>Content</div>
      </AsyncBoundary>,
    );
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Failed to load')).toBeTruthy();
    expect(screen.getByText('Network down')).toBeTruthy();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('calls onRetry when "Try again" is clicked', () => {
    const onRetry = vi.fn();
    render(<ListErrorState error="Oops" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('omits the retry button when no onRetry is provided', () => {
    render(<ListErrorState error="Oops" />);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('re-renders children once the error is cleared (reset)', () => {
    const { rerender } = render(
      <AsyncBoundary
        isLoading={false}
        isEmpty={false}
        error="Failed"
        errorContent={(err) => <ListErrorState error={err} />}
      >
        <div>Loaded data</div>
      </AsyncBoundary>,
    );
    expect(screen.queryByText('Loaded data')).toBeNull();

    rerender(
      <AsyncBoundary
        isLoading={false}
        isEmpty={false}
        error={null}
        errorContent={(err) => <ListErrorState error={err} />}
      >
        <div>Loaded data</div>
      </AsyncBoundary>,
    );
    expect(screen.getByText('Loaded data')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
