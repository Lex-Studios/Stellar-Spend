# Performance Testing Strategy

## Overview

Performance testing ensures the application meets performance requirements and can handle expected load.

## Load Testing with k6

### Running Locally

```bash
k6 run scripts/performance/load-test.js
```

### Running with Custom Base URL

```bash
BASE_URL=https://staging.stellar-spend.com k6 run scripts/performance/load-test.js
```

### Test Stages

1. **Ramp-up** (30s): 0 → 10 VUs
2. **Sustained Load** (1m30s): 10 → 50 VUs
3. **Peak Load** (1m): 50 → 100 VUs
4. **Ramp-down** (30s): 100 → 0 VUs

### Performance Thresholds

- **P95 Latency**: < 500ms
- **P99 Latency**: < 1000ms
- **Error Rate**: < 10%
- **Custom Error Rate**: < 5%

### Metrics Collected

- `http_req_duration`: Request duration
- `http_req_failed`: Failed requests
- `errors`: Custom error rate
- `successful_requests`: Successful request count
- `active_connections`: Active VU count

## CI/CD Integration

Performance tests run automatically on:

- Push to main/develop
- Pull requests
- Daily schedule (2 AM UTC)

Results are uploaded as artifacts and commented on PRs.

## Performance Budgets

| Endpoint                  | P95 Latency | Error Rate |
| ------------------------- | ----------- | ---------- |
| `/api/health`             | 200ms       | 0%         |
| `/api/offramp/quote`      | 1000ms      | 5%         |
| `/api/offramp/currencies` | 500ms       | 1%         |
| `/api/offramp/rate`       | 300ms       | 1%         |

## Baseline Metrics

Establish baseline metrics for regression detection:

```bash
k6 run scripts/performance/load-test.js --out json=baseline.json
```

## Continuous Monitoring

Monitor performance in production using CloudWatch metrics and Sentry performance monitoring.
