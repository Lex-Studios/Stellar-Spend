#!/usr/bin/env bash
# rollback.sh
# Rolls back to the previously active blue-green environment.
#
# Usage:
#   ./scripts/rollback.sh

set -euo pipefail

HEALTH_URL="http://localhost"
HEALTH_RETRIES=6
HEALTH_INTERVAL=5

if [ ! -f .active-env ]; then
  echo "ERROR: .active-env not found. Cannot determine current environment." >&2
  exit 1
fi

CURRENT=$(cat .active-env)
if [ "$CURRENT" = "blue" ]; then
  PREV="green"
  PREV_PORT=3001
  CURRENT_PORT=3000
else
  PREV="blue"
  PREV_PORT=3000
  CURRENT_PORT=3001
fi

echo "==> Rolling back from ${CURRENT} to ${PREV}..."

# Start the previous environment if not already running
docker compose -f "docker-compose.${PREV}.yml" up -d

# Health-check the previous environment
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -sf "${HEALTH_URL}:${PREV_PORT}/api/health" | grep -q '"status":"ok"'; then
    echo "  Previous environment ${PREV} is healthy"
    break
  fi
  if [ "$i" -eq "$HEALTH_RETRIES" ]; then
    echo "ERROR: Previous environment ${PREV} is not healthy. Manual intervention required." >&2
    exit 1
  fi
  echo "  Waiting for ${PREV}... (${i}/${HEALTH_RETRIES})"
  sleep "$HEALTH_INTERVAL"
done

# Switch traffic back
echo "$PREV" > .active-env
echo "==> Traffic switched back to ${PREV} (port ${PREV_PORT})"

# Stop the bad environment
docker compose -f "docker-compose.${CURRENT}.yml" down
echo "==> Rollback complete. Active: ${PREV}"
