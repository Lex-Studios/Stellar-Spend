/**
 * Shared skeleton primitive.
 *
 * Single parametrized shimmer block used across features. Supports size
 * (width/height) and shape (radius) props so feature-specific skeleton
 * markup can be replaced by this one primitive.
 */
import { cn } from '@/lib/utils';

export type SkeletonShape = 'line' | 'circle' | 'rect';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Preset shape controlling the border radius. */
  shape?: SkeletonShape;
  /** Explicit width (number is treated as px). */
  width?: number | string;
  /** Explicit height (number is treated as px). */
  height?: number | string;
}

const shapeClasses: Record<SkeletonShape, string> = {
  line: 'rounded',
  circle: 'rounded-full',
  rect: 'rounded-md',
};

function toCssSize(value?: number | string): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'number' ? `${value}px` : value;
}

export function Skeleton({
  shape = 'rect',
  width,
  height,
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse bg-muted', shapeClasses[shape], className)}
      style={{ width: toCssSize(width), height: toCssSize(height), ...style }}
      {...props}
    />
  );
}

export default Skeleton;
