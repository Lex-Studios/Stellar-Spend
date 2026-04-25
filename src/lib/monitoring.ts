/**
 * Production monitoring utilities.
 * Provides alert rules, uptime tracking, and dashboard metrics.
 */
import * as Sentry from '@sentry/nextjs';

// ── Alert thresholds ──────────────────────────────────────────────────────

export const ALERT_THRESHOLDS = {
  /** Error rate (errors per minute) that triggers a P1 alert */
  errorRateP1: 10,
  /** Error rate that triggers a P2 alert */
  errorRateP2: 3,
  /** API p95 latency (ms) that triggers a warning */
  latencyWarnMs: 3000,
  /** API p95 latency (ms) that triggers a critical alert */
  latencyCriticalMs: 8000,
  /** Queue depth that triggers a warning */
  queueDepthWarn: 50,
  /** Queue depth that triggers a critical alert */
  queueDepthCritical: 200,
} as const;

// ── Uptime tracking ───────────────────────────────────────────────────────

interface UptimeRecord {
  timestamp: number;
  ok: boolean;
  latencyMs: number;
}

const UPTIME_WINDOW = 100; // keep last N checks
const uptimeHistory: UptimeRecord[] = [];

export function recordUptimeCheck(ok: boolean, latencyMs: number): void {
  uptimeHistory.push({ timestamp: Date.now(), ok, latencyMs });
  if (uptimeHistory.length > UPTIME_WINDOW) uptimeHistory.shift();
}

export function getUptimePercent(): number {
  if (uptimeHistory.length === 0) return 100;
  const ok = uptimeHistory.filter((r) => r.ok).length;
  return (ok / uptimeHistory.length) * 100;
}

export function getAvgLatencyMs(): number {
  if (uptimeHistory.length === 0) return 0;
  return uptimeHistory.reduce((s, r) => s + r.latencyMs, 0) / uptimeHistory.length;
}

// ── Error tracking helpers ────────────────────────────────────────────────

export function captureTransactionError(
  error: unknown,
  context: Record<string, unknown>
): void {
  Sentry.withScope((scope) => {
    scope.setContext('transaction', context);
    scope.setTag('component', 'offramp');
    Sentry.captureException(error);
  });
}

export function captureQueueAlert(message: string, data: Record<string, unknown>): void {
  Sentry.withScope((scope) => {
    scope.setContext('queue', data);
    scope.setTag('component', 'priority-queue');
    scope.setLevel('warning');
    Sentry.captureMessage(message);
  });
}

// ── Dashboard metrics snapshot ────────────────────────────────────────────

export interface DashboardMetrics {
  uptimePercent: number;
  avgLatencyMs: number;
  checksRecorded: number;
  thresholds: typeof ALERT_THRESHOLDS;
  generatedAt: string;
}

export function getDashboardMetrics(): DashboardMetrics {
  return {
    uptimePercent: getUptimePercent(),
    avgLatencyMs: getAvgLatencyMs(),
    checksRecorded: uptimeHistory.length,
    thresholds: ALERT_THRESHOLDS,
    generatedAt: new Date().toISOString(),
  };
}
