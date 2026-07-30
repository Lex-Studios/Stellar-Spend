# Monitoring & Observability Guide

This guide explains how to monitor Stellar-Spend in production, interpret metrics, set up dashboards, configure alerts, and troubleshoot performance issues.

---

## Table of Contents

- [Overview](#overview)
- [Sentry Integration](#sentry-integration)
- [CloudWatch Logs and Metrics](#cloudwatch-logs-and-metrics)
- [Custom Metrics (performance.ts)](#custom-metrics-performancets)
- [Dashboard Setup](#dashboard-setup)
- [Alerting Thresholds and Escalation](#alerting-thresholds-and-escalation)
- [Funnel Metrics](#funnel-metrics)
- [Web Vitals Monitoring](#web-vitals-monitoring)
- [Troubleshooting Performance Issues](#troubleshooting-performance-issues)

---

## Overview

Stellar-Spend uses a layered observability stack:

| Layer                 | Tool                                                   | Purpose                                    |
| --------------------- | ------------------------------------------------------ | ------------------------------------------ |
| Error tracking        | Sentry                                                 | Capture and alert on exceptions            |
| Structured logging    | Custom logger (`src/lib/logger.ts`)                    | Searchable JSON logs shipped to CloudWatch |
| Application metrics   | `src/lib/performance.ts`                               | In-process API and DB timing, Web Vitals   |
| Uptime and alerting   | `src/lib/monitoring.ts`                                | Uptime checks, alert threshold evaluation  |
| User journey tracking | `src/lib/funnel.ts` + `src/hooks/useFunnelTracking.ts` | Conversion funnel visibility               |

---

## Sentry Integration

Sentry is the primary error tracking and alerting tool. Configuration lives in:

- **Client:** `sentry.client.config.ts`
- **Server:** `sentry.server.config.ts`
- **Edge:** `sentry.edge.config.ts`

### Environment Variables

| Variable                     | Description                                              |
| ---------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`     | Sentry project DSN (client + server)                     |
| `SENTRY_DSN`                 | Sentry project DSN (server-only)                         |
| `NEXT_PUBLIC_SENTRY_RELEASE` | Release identifier (e.g., git SHA) — set during CI       |
| `NEXT_PUBLIC_ENV`            | Environment name: `production`, `staging`, `development` |
| `SENTRY_AUTH_TOKEN`          | Used by CI to upload source maps                         |

### Sampling Rates

| Environment | Traces Sample Rate | Session Replay (normal) | Session Replay (on error) |
| ----------- | ------------------ | ----------------------- | ------------------------- |
| Production  | 10%                | 1%                      | 100%                      |
| Development | 100%               | 1%                      | 100%                      |

Adjust `tracesSampleRate` in production if transaction volume is high and Sentry costs become a concern.

### Error Filtering

The client config filters out known noisy errors:

```
ResizeObserver loop limit exceeded
Non-Error promise rejection captured
^Network Error$
^Request aborted$
```

Add additional patterns to `ignoreErrors` in `sentry.client.config.ts` as needed.

### Sensitive Data Redaction

Both client and server configs redact sensitive fields before sending events to Sentry:

**Client (request body):** `privateKey`, `secret`, `password`, `token` → `[Filtered]`

**Server (request headers):** `authorization`, `x-api-key` → `[Filtered]`

> ⚠️ Never disable these `beforeSend` hooks in production. Sentry events are stored on Sentry's servers and must not contain secrets.

### Capturing Errors Programmatically

Use the helpers in `src/lib/monitoring.ts`:

```typescript
import { captureTransactionError, captureQueueAlert } from "@/lib/monitoring";

// Capture an exception with transaction context
captureTransactionError(error, {
  transactionId: tx.id,
  userAddress: tx.userAddress,
  amount: tx.amount,
});

// Capture a queue depth warning
captureQueueAlert("Queue depth exceeded warning threshold", {
  depth: queue.length,
  threshold: ALERT_THRESHOLDS.queueDepthWarn,
});
```

These helpers use `Sentry.withScope` to attach structured context without polluting the global Sentry scope.

### Session Replay

Session replay is enabled in the client config using:

```typescript
Sentry.replayIntegration({
  maskAllText: true, // Masks all text content in replays
  blockAllMedia: true, // Prevents images/video from being captured
});
```

These privacy settings ensure user data is not captured in replays. Do not disable them in production.

### Viewing Errors in Sentry

1. Navigate to [sentry.io](https://sentry.io) → your Stellar-Spend project
2. Use **Issues** to browse recent errors grouped by fingerprint
3. Use **Performance** to view trace data and slow transactions
4. Use **Replays** to view session recordings associated with errors
5. Filter by `environment:production` to exclude development noise

---

## CloudWatch Logs and Metrics

Stellar-Spend ships structured JSON logs to CloudWatch (or your configured log destination) using the logger in `src/lib/logger.ts`.

### Log Format

All logs are emitted as JSON with consistent fields:

```json
{
  "level": "info",
  "message": "Session created",
  "timestamp": "2026-05-26T12:34:56.789Z",
  "userId": "G...",
  "sessionId": "session_1748260496_abc123",
  "ipAddress": "203.0.113.42"
}
```

### Log Levels

| Level   | Usage                                                              |
| ------- | ------------------------------------------------------------------ |
| `error` | Unhandled exceptions, failed transactions, external service errors |
| `warn`  | Rate limit hits, validation failures, retried operations           |
| `info`  | Normal application events (session creation, transaction creation) |
| `debug` | Detailed trace data (development only — disabled in production)    |

### CloudWatch Setup (AWS)

1. Configure your Next.js deployment to forward `stdout` / `stderr` to a CloudWatch log group. On ECS/Fargate this happens automatically via the `awslogs` log driver:

   ```json
   {
     "logDriver": "awslogs",
     "options": {
       "awslogs-group": "/stellar-spend/production",
       "awslogs-region": "us-east-1",
       "awslogs-stream-prefix": "app"
     }
   }
   ```

2. On Vercel, use a **Log Drain** (Settings → Log Drains) to ship logs to CloudWatch, Datadog, or any HTTP endpoint.

### Useful CloudWatch Log Insights Queries

**Count errors in the last hour:**

```
fields @timestamp, level, message
| filter level = "error"
| stats count() as error_count by bin(5m)
| sort @timestamp desc
```

**Failed transactions in the last 24 hours:**

```
fields @timestamp, message, transactionId, userAddress
| filter message like "Transaction failed"
| sort @timestamp desc
| limit 100
```

**Session creation rate:**

```
fields @timestamp, message
| filter message like "Session created"
| stats count() as sessions by bin(1h)
```

### CloudWatch Metrics to Track

Create CloudWatch metric filters for the following log patterns to drive dashboard widgets and alarms:

| Metric Name           | Log Filter Pattern                      | Unit  |
| --------------------- | --------------------------------------- | ----- |
| `ErrorCount`          | `{ $.level = "error" }`                 | Count |
| `SessionCreationRate` | `{ $.message = "Session created" }`     | Count |
| `TransactionFailures` | `{ $.message = "Transaction failed" }`  | Count |
| `RateLimitHits`       | `{ $.message = "Rate limit exceeded" }` | Count |
| `IPViolations`        | `{ $.message = "IP violation" }`        | Count |

---

## Custom Metrics (`performance.ts`)

The in-process metrics store in [`src/lib/performance.ts`](../src/lib/performance.ts) tracks API timings, database query durations, Web Vitals, and funnel events using circular buffers (no external dependencies).

### Architecture

All metrics are stored in module-level circular buffers that survive across requests within the same Node.js process. The buffer size is **500 entries** for API and DB timings, and **2,000 entries** for funnel events.

> ⚠️ In a multi-instance deployment, each instance maintains its own in-memory buffers. Aggregate metrics across instances by querying the `/api/metrics` endpoint on each instance, or by exporting metrics to a centralised store.

### API Timing Metrics

**Recording a timing:**

```typescript
import { recordApiTiming } from "@/lib/performance";

recordApiTiming({
  route: "/api/transactions",
  method: "POST",
  durationMs: 245,
  statusCode: 200,
  timestamp: Date.now(),
});
```

**Retrieving metrics:**

```typescript
import { getApiMetrics } from "@/lib/performance";

const metrics = getApiMetrics();
// metrics.overall       → { p50, p95, p99, avg, min, max, count }
// metrics.byRoute       → same stats keyed by "METHOD /route"
// metrics.slowest       → top 10 slowest TimingEntry objects
// metrics.errorRate     → fraction of 5xx responses (0.0–1.0)
```

### Database Query Metrics

**Recording a query:**

```typescript
import { recordDbQuery } from "@/lib/performance";

recordDbQuery({
  query: "SELECT * FROM transactions WHERE user_address = $1",
  durationMs: 12,
  timestamp: Date.now(),
});
```

**Retrieving metrics:**

```typescript
import { getDbMetrics } from "@/lib/performance";

const metrics = getDbMetrics();
// metrics.overall → { p50, p95, p99, avg, min, max, count }
// metrics.slowest → top 10 slowest QueryEntry objects
```

### Performance Alert Thresholds

Thresholds are defined in `PERF_THRESHOLDS`:

| Threshold          | Value    | Meaning                        |
| ------------------ | -------- | ------------------------------ |
| `apiP95WarnMs`     | 2,000 ms | API p95 latency warning level  |
| `apiP95CriticalMs` | 5,000 ms | API p95 latency critical level |
| `dbP95WarnMs`      | 500 ms   | DB p95 latency warning level   |
| `dbP95CriticalMs`  | 2,000 ms | DB p95 latency critical level  |

**Checking alert state:**

```typescript
import { getPerfAlerts } from "@/lib/performance";

const alerts = getPerfAlerts();
// alerts.apiLatency → 'ok' | 'warn' | 'critical'
// alerts.dbLatency  → 'ok' | 'warn' | 'critical'
```

Expose these via the `/api/metrics` endpoint and poll from your monitoring system.

### Uptime Tracking

```typescript
import {
  recordUptimeCheck,
  getUptimePercent,
  getAvgLatencyMs,
} from "@/lib/monitoring";

// Record a health check result
recordUptimeCheck(true, 45); // ok=true, latencyMs=45

// Get uptime percentage over the last 100 checks
const uptime = getUptimePercent(); // e.g., 99.5

// Get average latency
const avgLatency = getAvgLatencyMs(); // e.g., 52
```

---

## Dashboard Setup

### Recommended Dashboard Layout

Create a dashboard with the following panels. The exact tool (CloudWatch, Datadog, Grafana) is deployment-dependent.

#### Panel 1: Uptime & Availability

- **Metric:** `uptimePercent` from `getDashboardMetrics()`
- **Visualisation:** Single stat with thresholds (green ≥99%, yellow ≥95%, red <95%)
- **Refresh:** 1 minute

#### Panel 2: API Latency Percentiles

- **Metrics:** p50, p95, p99 from `getApiMetrics().overall`
- **Visualisation:** Time-series line chart
- **Alert lines:** Warn at 2,000 ms, critical at 5,000 ms (p95)

#### Panel 3: Error Rate

- **Metric:** `errorRate` from `getApiMetrics()` (multiply by 100 for percentage)
- **Visualisation:** Time-series bar chart
- **Alert:** > 5% error rate triggers P2 alert

#### Panel 4: Database Query Latency

- **Metrics:** p50, p95, p99 from `getDbMetrics().overall`
- **Visualisation:** Time-series line chart
- **Alert lines:** Warn at 500 ms, critical at 2,000 ms (p95)

#### Panel 5: Transaction Volume

- **Metric:** Transaction creation count from CloudWatch log filter
- **Visualisation:** Time-series bar chart
- **Breakdown:** Success vs. failure

#### Panel 6: Queue Depth

- **Metric:** Priority queue depth (from `captureQueueAlert` events in Sentry)
- **Visualisation:** Time-series gauge
- **Alert lines:** Warn at 50, critical at 200

#### Panel 7: Funnel Conversion

- **Metric:** `getFunnelCounts()` step counts
- **Visualisation:** Funnel chart or bar chart
- **Steps:** `wallet_connect` → `amount_enter` → `beneficiary_enter` → `quote_view` → `transaction_submit` → `transaction_complete`

#### Panel 8: Web Vitals

- **Metrics:** LCP p75, FID p75, CLS p75 from `getVitalsMetrics()`
- **Visualisation:** Single stats with Core Web Vitals thresholds (green/yellow/red)

### Setting Up the Metrics Endpoint

Expose metrics for external scraping by creating a protected API route:

```typescript
// src/app/api/metrics/route.ts
import {
  getApiMetrics,
  getDbMetrics,
  getVitalsMetrics,
  getFunnelCounts,
} from "@/lib/performance";
import { getDashboardMetrics, getPerfAlerts } from "@/lib/monitoring";

export async function GET(request: Request) {
  // Protect with admin token
  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${process.env.API_KEY_ADMIN_TOKEN}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  return Response.json({
    api: getApiMetrics(),
    db: getDbMetrics(),
    vitals: getVitalsMetrics(),
    funnel: getFunnelCounts(),
    dashboard: getDashboardMetrics(),
    alerts: getPerfAlerts(),
  });
}
```

---

## Alerting Thresholds and Escalation

### Alert Definitions

Alert thresholds are defined in `src/lib/monitoring.ts` (`ALERT_THRESHOLDS`):

| Alert                | Threshold                  | Severity | Description                   | Runbook                                   |
| -------------------- | -------------------------- | -------- | ----------------------------- | ----------------------------------------- |
| Error rate critical  | ≥ 10 errors/min            | P1       | Immediate action required     | [RB-004](./runbooks/high-error-rate.md)   |
| Error rate warning   | ≥ 3 errors/min             | P2       | Investigate within 30 minutes | [RB-004](./runbooks/high-error-rate.md)   |
| API latency warning  | p95 ≥ 3,000 ms             | P2       | User experience degraded      | [RB-004](./runbooks/high-error-rate.md)   |
| API latency critical | p95 ≥ 8,000 ms             | P1       | Users experiencing failures   | [RB-004](./runbooks/high-error-rate.md)   |
| Queue depth warning  | ≥ 50 items                 | P2       | Processing backlog building   | [RB-004](./runbooks/high-error-rate.md)   |
| Queue depth critical | ≥ 200 items                | P1       | Severe processing backlog     | [RB-004](./runbooks/high-error-rate.md)   |
| Uptime below 99%     | < 99% over last 100 checks | P2       | Availability SLA at risk      | [RB-004](./runbooks/high-error-rate.md)   |
| Uptime below 95%     | < 95% over last 100 checks | P1       | Availability SLA breached     | [RB-004](./runbooks/high-error-rate.md)   |
| Bridge stuck         | Pending > 20 min           | P1       | Funds in-flight               | [RB-001](./runbooks/stuck-bridge.md)      |
| Provider unavailable | 5 consecutive failures     | P1       | No new transactions           | [RB-002](./runbooks/provider-outage.md)   |
| DB unhealthy         | RDS health check failing   | P1       | Full outage                   | [RB-003](./runbooks/database-failover.md) |
| DB replication lag   | Replica lag > 5 min        | P1       | RPO at risk                   | [RB-003](./runbooks/database-failover.md) |
| Backup failed        | Scheduled job failed       | P2       | Recovery point degraded       | [RB-005](./runbooks/backup-failure.md)    |

## Notifications & Integrations

We support sending CloudWatch alarm notifications to Slack and PagerDuty via an SNS topic. Configure these values in your Terraform variables (see `terraform/variables.tf`):

- **`slack_webhook_url`**: Incoming Slack webhook URL. When set, Terraform will create an `aws_sns_topic_subscription` that forwards alarm notifications to this URL.
- **`pagerduty_integration_url`**: PagerDuty Events v2 integration URL (the `https://events.pagerduty.com/v2/enqueue` endpoint for your service). When set, Terraform will subscribe this endpoint to the alert SNS topic.

If you don't provide an external `alarm_sns_arn`, Terraform will create a default SNS topic named `${local.name_prefix}-alerts` and wire all alarms to it.

Recommended steps to enable notifications:

1. Create or locate a Slack incoming webhook and set `slack_webhook_url` in your Terraform environment (keep it secret).
2. In PagerDuty create a new Events v2 integration for the service you want alerted and set `pagerduty_integration_url`.
3. Apply Terraform: `terraform init && terraform apply`.

Note: Slack and PagerDuty subscriptions expect HTTPS endpoints and will receive the standard CloudWatch alarm JSON payload. If you need custom formatting, configure an AWS Lambda subscriber to translate SNS messages to the desired format and subscribe the Lambda to the SNS topic instead.

## Applying the Terraform Changes

The Terraform changes add:

- CloudWatch alarms for ECS, RDS and ALB (CPU, memory, latency, 5xx rate)
- A CloudWatch dashboard (`aws_cloudwatch_dashboard.main`)
- A CloudWatch Log Metric Filter (`ErrorCount`) to count application errors
- New alarms for application error rate and ALB unhealthy hosts
- Optional SNS topic + subscriptions for Slack and PagerDuty

To deploy these changes:

```bash
cd terraform
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

Keep your webhook/URL values secret and store them in a secure variable store or CI secrets.

### Performance Thresholds (`performance.ts`)

| Alert           | Threshold  | Severity |
| --------------- | ---------- | -------- |
| API p95 latency | ≥ 2,000 ms | Warning  |
| API p95 latency | ≥ 5,000 ms | Critical |
| DB p95 latency  | ≥ 500 ms   | Warning  |
| DB p95 latency  | ≥ 2,000 ms | Critical |

### Escalation Policy

| Severity          | Response Time     | Owner            | Escalation                              |
| ----------------- | ----------------- | ---------------- | --------------------------------------- |
| **P1 — Critical** | 15 minutes        | On-call engineer | Escalate to engineering lead at 30 min  |
| **P2 — Warning**  | 30 minutes        | On-call engineer | Escalate to P1 if unresolved in 2 hours |
| **P3 — Info**     | Next business day | Development team | No escalation required                  |

### Setting Up Alerts

**Sentry Alerts:**

1. In Sentry: Project → Alerts → Create Alert Rule
2. Configure: "When `event.level:error` count > 10 in 1 minute, notify #incidents Slack channel"

**CloudWatch Alarms:**

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "stellar-spend-error-rate-p1" \
  --metric-name "ErrorCount" \
  --namespace "StellarSpend" \
  --statistic Sum \
  --period 60 \
  --threshold 10 \
  --comparison-operator GreaterThanOrEqualToThreshold \
  --alarm-actions "arn:aws:sns:us-east-1:123456789:PagerDuty-P1"
```

---

## Funnel Metrics

Stellar-Spend tracks user journey steps through the offramp flow using funnel events.

### Funnel Steps

The conversion funnel covers these steps in order:

| Step | Event Action           | Description                             |
| ---- | ---------------------- | --------------------------------------- |
| 1    | `wallet_connect`       | User connects their Stellar wallet      |
| 2    | `amount_enter`         | User enters the send amount             |
| 3    | `currency_select`      | User selects the destination currency   |
| 4    | `beneficiary_enter`    | User enters beneficiary account details |
| 5    | `quote_view`           | User views the rate quote               |
| 6    | `transaction_submit`   | User submits the transaction            |
| 7    | `bridge_initiated`     | Bridge transfer is initiated            |
| 8    | `payout_initiated`     | Paycrest payout order is created        |
| 9    | `transaction_complete` | Transaction reaches `completed` status  |

### Recording Events

Events are recorded automatically via the `useFunnelTracking` hook. To record a server-side funnel event:

```typescript
import { recordFunnelEvent } from "@/lib/performance";

recordFunnelEvent({
  action: "transaction_complete",
  sessionId: session.id,
  timestamp: Date.now(),
});
```

### Retrieving Funnel Counts

```typescript
import { getFunnelCounts } from "@/lib/performance";

const counts = getFunnelCounts();
// {
//   wallet_connect: 1842,
//   amount_enter: 1621,
//   quote_view: 1489,
//   transaction_submit: 1201,
//   transaction_complete: 1098,
// }
```

### Interpreting Funnel Metrics

**Conversion rate calculation:**

```
Overall Conversion Rate = (transaction_complete / wallet_connect) × 100
Step Drop-off Rate = ((step_n - step_n+1) / step_n) × 100
```

**Key drop-off points to watch:**

- `quote_view → transaction_submit`: High drop-off here may indicate the rate/fee is too high
- `transaction_submit → payout_initiated`: Drop-off here indicates technical errors during submission
- `payout_initiated → transaction_complete`: Drop-off here indicates Paycrest payout failures

**Note:** Funnel counts are in-memory and reset on process restart. For persistent funnel analytics, emit events to a database or analytics service in addition to the in-memory store.

---

## Web Vitals Monitoring

Web Vitals are collected via the `useWebVitals` hook (`src/hooks/useWebVitals.ts`) and recorded via `recordVital` in `src/lib/performance.ts`.

### Collected Metrics

| Metric | Full Name                 | Good    | Needs Improvement | Poor    |
| ------ | ------------------------- | ------- | ----------------- | ------- |
| `LCP`  | Largest Contentful Paint  | ≤ 2.5s  | ≤ 4.0s            | > 4.0s  |
| `FID`  | First Input Delay         | ≤ 100ms | ≤ 300ms           | > 300ms |
| `CLS`  | Cumulative Layout Shift   | ≤ 0.1   | ≤ 0.25            | > 0.25  |
| `FCP`  | First Contentful Paint    | ≤ 1.8s  | ≤ 3.0s            | > 3.0s  |
| `TTFB` | Time to First Byte        | ≤ 800ms | ≤ 1.8s            | > 1.8s  |
| `INP`  | Interaction to Next Paint | ≤ 200ms | ≤ 500ms           | > 500ms |

### Retrieving Web Vitals Data

```typescript
import { getVitalsMetrics } from "@/lib/performance";

const vitals = getVitalsMetrics();
// vitals.byName = {
//   LCP: { avg: 1820, p75: 2100, count: 312, ratings: { good: 280, 'needs-improvement': 32 } },
//   CLS: { avg: 0.04, p75: 0.08, count: 312, ratings: { good: 305, 'needs-improvement': 7 } },
//   ...
// }
```

### Target Thresholds

Aim for all Core Web Vitals to be in the **"Good"** range at the 75th percentile (p75). These are Google's Page Experience ranking signals.

### Sending Web Vitals to Analytics

The `useWebVitals` hook forwards metrics to both the in-process store and optionally to an analytics endpoint. To also send to Google Analytics 4:

```typescript
import { useWebVitals } from "@/hooks/useWebVitals";

useWebVitals(({ name, value, rating }) => {
  gtag("event", name, {
    value: Math.round(name === "CLS" ? value * 1000 : value),
    metric_rating: rating,
  });
});
```

---

## Troubleshooting Performance Issues

### High API Latency (p95 > 2,000 ms)

**Diagnosis steps:**

1. Check `getApiMetrics().byRoute` to identify which routes are slow
2. Check `getDbMetrics().slowest` to see if slow DB queries are the cause
3. Review Sentry Performance traces for the slow routes
4. Check CloudWatch logs for external service call durations (Paycrest, Allbridge, Stellar Horizon)

**Common causes and fixes:**

| Symptom                 | Likely Cause                                     | Fix                                                     |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| All routes slow equally | Database overloaded or connection pool exhausted | Increase pool size; optimise slow queries               |
| Specific route slow     | Missing index on a query in that route           | Add index (see [Database Schema](./database-schema.md)) |
| Intermittent spikes     | External service (Paycrest/Allbridge) slow       | Implement circuit breaker; add retry with backoff       |
| Increasing over time    | Memory pressure in Node.js process               | Check for memory leaks; increase container memory       |

---

### High Error Rate (> 5%)

**Diagnosis steps:**

1. Open Sentry Issues dashboard, filter to `environment:production` and last 1 hour
2. Group errors by fingerprint — identify the dominant error type
3. Check `getApiMetrics().errorRate` via the `/api/metrics` endpoint
4. Review CloudWatch logs with `filter level = "error"`

**Common causes:**

- Database connection failures → check `DATABASE_URL` and PostgreSQL health
- External API timeouts → check Paycrest/Allbridge/Stellar status pages
- Schema mismatch → check if latest migrations have been applied
- Out-of-memory crashes → increase instance memory or optimise code

---

### Slow Database Queries

**Diagnosis steps:**

1. Check `getDbMetrics().slowest` for the 10 slowest recent queries
2. Run `EXPLAIN ANALYSE` on the slow query in a read replica
3. Check PostgreSQL `pg_stat_statements` for query statistics:
   ```sql
   SELECT query, mean_exec_time, calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 20;
   ```

**Common fixes:**

- Add the missing index identified by `EXPLAIN ANALYSE`
- Rewrite the query to use existing indexes (avoid `LIKE '%search%'` on unindexed columns)
- Increase `work_mem` for sort-heavy queries
- Partition the `transactions` table by timestamp range if it has grown very large

---

### Funnel Drop-off Spike

**Diagnosis steps:**

1. Compare `getFunnelCounts()` for the current period with the previous period
2. Identify which step has the largest unexpected drop-off
3. Check for errors at that step in Sentry and CloudWatch logs
4. Test the flow manually in a staging environment

**Common causes:**

- New validation error introduced in a recent deployment
- External service (Paycrest) rejecting more orders than usual
- UI bug preventing users from completing a form step

---

### Web Vitals Degradation

**Diagnosis steps:**

1. Check `getVitalsMetrics()` for the affected metric
2. Use Sentry Performance or Lighthouse CI for page-level analysis
3. Check if a recent deploy introduced a large JavaScript bundle or new above-the-fold resource

**Common fixes:**

| Metric            | Fix                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------- |
| LCP degraded      | Lazy-load below-the-fold images; preload the LCP image; use CDN                     |
| CLS increased     | Set explicit `width` and `height` on images; avoid inserting content above the fold |
| FID/INP increased | Move heavy JavaScript off the main thread; defer non-critical scripts               |
| TTFB increased    | Enable Vercel Edge caching; move to a region closer to your users                   |

---

## Related Documentation

- [Error Codes & Troubleshooting](./error-codes.md)
- [Security Best Practices](./security-best-practices.md)
- [Database Schema](./database-schema.md)
- [Infrastructure](./infrastructure.md)
- [Deployment Guide](./deployment.md)
