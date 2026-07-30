/**
 * Performance monitoring utilities for tracking and optimizing application performance.
 * Measures Core Web Vitals, component render times, and bundle size.
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

const metrics: PerformanceMetric[] = [];

/**
 * Record a performance metric.
 */
export function recordMetric(
  name: string,
  value: number,
  unit: string = "ms",
): void {
  metrics.push({
    name,
    value,
    unit,
    timestamp: Date.now(),
  });

  // Keep only last 1000 metrics
  if (metrics.length > 1000) {
    metrics.shift();
  }
}

/**
 * Get all recorded metrics.
 */
export function getMetrics(): PerformanceMetric[] {
  return [...metrics];
}

/**
 * Clear all metrics.
 */
export function clearMetrics(): void {
  metrics.length = 0;
}

/**
 * Measure component render time.
 */
export function measureRenderTime(
  componentName: string,
  renderFn: () => void,
): void {
  const start = performance.now();
  renderFn();
  const duration = performance.now() - start;
  recordMetric(`render:${componentName}`, duration);
}

/**
 * Measure async operation time.
 */
export async function measureAsync<T>(
  operationName: string,
  asyncFn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await asyncFn();
  } finally {
    const duration = performance.now() - start;
    recordMetric(`async:${operationName}`, duration);
  }
}

/**
 * Get Core Web Vitals (LCP, FID, CLS).
 */
export function observeWebVitals(
  callback: (metric: { name: string; value: number; rating: string }) => void,
): void {
  if (typeof window === "undefined") return;

  // Largest Contentful Paint (LCP)
  if ("PerformanceObserver" in window) {
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        callback({
          name: "LCP",
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating:
            lastEntry.renderTime || lastEntry.loadTime > 2500 ? "poor" : "good",
        });
      });
      lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
    } catch {
      // LCP not supported
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            !(entry as PerformanceEntry & { hadRecentInput?: boolean })
              .hadRecentInput
          ) {
            clsValue +=
              (entry as PerformanceEntry & { value?: number }).value || 0;
          }
        }
        callback({
          name: "CLS",
          value: clsValue,
          rating: clsValue > 0.1 ? "poor" : "good",
        });
      });
      clsObserver.observe({ entryTypes: ["layout-shift"] });
    } catch {
      // CLS not supported
    }
  }

  // First Input Delay (FID) - deprecated, use INP instead
  if ("PerformanceObserver" in window) {
    try {
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          callback({
            name: "FID",
            value:
              (entry as PerformanceEntry & { processingDuration?: number })
                .processingDuration || 0,
            rating:
              ((entry as PerformanceEntry & { processingDuration?: number })
                .processingDuration || 0) > 100
                ? "poor"
                : "good",
          });
        });
      });
      fidObserver.observe({ entryTypes: ["first-input"] });
    } catch {
      // FID not supported
    }
  }
}

/**
 * Get bundle size information.
 */
export function getBundleSize(): {
  total: number;
  main: number;
  chunks: Record<string, number>;
} {
  if (typeof window === "undefined") {
    return { total: 0, main: 0, chunks: {} };
  }

  const perfData = performance.getEntriesByType("resource");
  const bundleSize = {
    total: 0,
    main: 0,
    chunks: {} as Record<string, number>,
  };

  perfData.forEach((entry) => {
    const name = entry.name;
    const size = (entry as PerformanceResourceTiming).transferSize || 0;

    if (name.includes("_next/static")) {
      bundleSize.total += size;
      if (name.includes("main")) {
        bundleSize.main = size;
      } else if (name.includes("chunks")) {
        const chunkName = name.split("/").pop() || "unknown";
        bundleSize.chunks[chunkName] = size;
      }
    }
  });

  return bundleSize;
}

/**
 * Report performance metrics to analytics.
 */
export function reportMetrics(
  endpoint: string,
  metrics: PerformanceMetric[],
): void {
  if (typeof window === "undefined") return;

  // Use sendBeacon for reliability
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(metrics));
  } else {
    // Fallback to fetch
    fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(metrics),
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {
      // Silently fail
    });
  }
}
