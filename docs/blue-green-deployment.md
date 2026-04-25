# Blue-Green Deployment

Stellar-Spend supports zero-downtime blue-green deployments using Docker Compose.

## How It Works

Two identical environments — **blue** (port 3000) and **green** (port 3001) — run side by side. Only one is active (receiving traffic) at a time. A new release is deployed to the inactive environment, health-checked, then traffic is switched. The old environment is stopped only after the switch succeeds.

```
                  ┌─────────────────────────────────────────┐
                  │           Load Balancer / Nginx          │
                  └──────────────┬──────────────────────────┘
                                 │ active traffic
                    ┌────────────▼────────────┐
                    │   Blue  (port 3000)     │  ← currently live
                    └─────────────────────────┘
                    ┌─────────────────────────┐
                    │   Green (port 3001)     │  ← idle / next deploy target
                    └─────────────────────────┘
```

## Files

| File | Purpose |
|------|---------|
| `docker-compose.blue.yml` | Blue environment (port 3000) |
| `docker-compose.green.yml` | Green environment (port 3001) |
| `scripts/blue-green-deploy.sh` | Deploy new version to inactive slot |
| `scripts/rollback.sh` | Roll back to the previous slot |
| `.active-env` | Tracks which slot is currently active (auto-managed) |

## Deploy a New Version

```bash
# Make the scripts executable (first time only)
chmod +x scripts/blue-green-deploy.sh scripts/rollback.sh

# Deploy image tagged "v1.2.3" (defaults to "latest" if omitted)
./scripts/blue-green-deploy.sh v1.2.3
```

The script:
1. Builds the new Docker image
2. Starts the inactive environment
3. Runs health checks against `/api/health` (up to 10 retries × 5 s)
4. Switches traffic by updating `.active-env`
5. Stops the old environment

If health checks fail, the new environment is stopped and the active environment is left untouched.

## Rollback

```bash
./scripts/rollback.sh
```

This starts the previously active environment, verifies it is healthy, switches traffic back, and stops the bad environment.

## Traffic Switching

The scripts write the active slot name to `.active-env`. In a real production setup, integrate the traffic switch step with your load balancer:

**Nginx example** — update `proxy_pass` and reload:
```nginx
upstream stellar_spend {
    server localhost:3000;  # change to 3001 for green
}
```

```bash
# After updating the upstream port:
nginx -s reload
```

**AWS ALB / ECS** — update the target group weights via the AWS CLI or console.

## Health Checks

Both environments expose `/api/health`. The deploy script polls this endpoint before switching traffic. The Docker containers also have built-in `HEALTHCHECK` instructions that Docker monitors independently.

```bash
# Manual check
curl http://localhost:3000/api/health
curl http://localhost:3001/api/health
```
