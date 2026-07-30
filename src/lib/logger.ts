/**
 * Centralized structured logger.
 *
 * Outputs newline-delimited JSON to stdout so ECS/CloudWatch can ingest,
 * parse, and filter log entries without a sidecar agent.
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('quote.fetched', { currency, amount });
 *   logger.error('payout.failed', { orderId }, error);
 *
 *   // With request correlation:
 *   const log = logger.withContext({ requestId, userId });
 *   log.info('request.start', { method, path });
 *
 * Log schema: docs/logging-schema.md
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  /** Request / trace correlation */
  requestId?: string;
  /** Arbitrary structured fields */
  [key: string]: unknown;
}

// ── Redaction ─────────────────────────────────────────────────────────────────

/** Keys whose values are fully redacted (security secrets) */
const REDACT_KEYS = new Set([
  "privatekey",
  "private_key",
  "apikey",
  "api_key",
  "secret",
  "password",
  "token",
  "authorization",
  "x-api-key",
  "database_url",
]);

/** PII patterns — values matching these regexes are masked */
const PII_PATTERNS: Array<{ pattern: RegExp; mask: string }> = [
  // Email addresses
  {
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    mask: "[EMAIL]",
  },
  // Phone numbers (international and local formats)
  { pattern: /\+?[\d\s\-().]{7,15}\d/g, mask: "[PHONE]" },
  // Bank account numbers (8–18 consecutive digits)
  { pattern: /\b\d{8,18}\b/g, mask: "[ACCOUNT]" },
];

function maskPii(value: string): string {
  let out = value;
  for (const { pattern, mask } of PII_PATTERNS) {
    out = out.replace(pattern, mask);
  }
  return out;
}

function redact(obj: unknown, depth = 0): unknown {
  if (depth > 6 || obj === null || typeof obj !== "object") {
    // Mask PII in string values
    if (typeof obj === "string") return maskPii(obj);
    return obj;
  }
  if (Array.isArray(obj)) return obj.map((v) => redact(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    out[k] = REDACT_KEYS.has(k.toLowerCase())
      ? "[REDACTED]"
      : redact(v, depth + 1);
  }
  return out;
}

// ── Level ordering ────────────────────────────────────────────────────────────

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function minLevel(): LogLevel {
  const env = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  return env && env in LEVELS
    ? env
    : process.env.NODE_ENV === "production"
      ? "info"
      : "debug";
}

// ── Core emit ─────────────────────────────────────────────────────────────────

function emit(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown>,
  error?: unknown,
  context: Record<string, unknown> = {},
): void {
  if (LEVELS[level] < LEVELS[minLevel()]) return;

  const entry: LogEntry = {
    level,
    event,
    timestamp: new Date().toISOString(),
    service: "stellar-spend",
    environment: process.env.NODE_ENV ?? "development",
    ...context,
    ...(redact(fields) as Record<string, unknown>),
  };

  if (error instanceof Error) {
    entry.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  } else if (error !== undefined) {
    entry.error = String(error);
  }

  // Write to stdout as NDJSON — ECS/CloudWatch picks this up automatically
  process.stdout.write(JSON.stringify(entry) + "\n");
}

// ── Logger factory ────────────────────────────────────────────────────────────

export interface Logger {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>, error?: unknown): void;
  error(event: string, fields?: Record<string, unknown>, error?: unknown): void;
  /** Returns a child logger with pre-bound context fields (e.g. requestId). */
  withContext(ctx: Record<string, unknown>): Logger;
}

function createLogger(context: Record<string, unknown> = {}): Logger {
  return {
    debug: (event, fields = {}) =>
      emit("debug", event, fields, undefined, context),
    info: (event, fields = {}) =>
      emit("info", event, fields, undefined, context),
    warn: (event, fields = {}, error?) =>
      emit("warn", event, fields, error, context),
    error: (event, fields = {}, error?) =>
      emit("error", event, fields, error, context),
    withContext: (ctx) => createLogger({ ...context, ...ctx }),
  };
}

export const logger: Logger = createLogger();
