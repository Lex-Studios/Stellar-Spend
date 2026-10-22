import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton data-testid="skeleton" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('skeleton');
  });

  it('applies size variants', () => {
    const { rerender } = render(<Skeleton data-testid="skeleton" size="sm" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--sm');

    rerender(<Skeleton data-testid="skeleton" size="md" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--md');

    rerender(<Skeleton data-testid="skeleton" size="lg" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--lg');
  });

  it('applies shape variants', () => {
    const { rerender } = render(<Skeleton data-testid="skeleton" shape="text" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--text');

    rerender(<Skeleton data-testid="skeleton" shape="circle" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--circle');

    rerender(<Skeleton data-testid="skeleton" shape="rect" />);
    expect(screen.getByTestId('skeleton')).toHaveClass('skeleton--rect');
  });

  it('merges custom className with variant classes', () => {
    render(<Skeleton data-testid="skeleton" size="sm" shape="circle" className="custom" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveClass('skeleton');
    expect(el).toHaveClass('skeleton--sm');
    expect(el).toHaveClass('skeleton--circle');
    expect(el).toHaveClass('custom');
  });

  it('forwards additional props to the underlying element', () => {
    render(<Skeleton data-testid="skeleton" aria-label="loading" />);
    expect(screen.getByTestId('skeleton')).toHaveAttribute('aria-label', 'loading');
  });
});
