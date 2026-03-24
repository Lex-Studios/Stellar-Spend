interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  "aria-label"?: string;
}

/**
 * Inline skeleton placeholder. Matches the exact dimensions of its loaded
 * counterpart so no layout shift occurs when data arrives.
 * pointer-events: none and user-select: none are applied via the .skeleton CSS class.
 */
export function Skeleton({ width, height, className = "", "aria-label": ariaLabel }: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`}
      style={{ width, height }}
      role="status"
      aria-label={ariaLabel ?? "Loading…"}
      aria-busy="true"
    />
  );
}
