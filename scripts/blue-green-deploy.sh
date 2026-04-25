#!/usr/bin/env bash
# blue-green-deploy.sh
# Zero-downtime blue-green deployment for Stellar-Spend (Docker Compose).
#
# Usage:
#   ./scripts/blue-green-deploy.sh [IMAGE_TAG]
#
# Requirements: docker, docker compose, curl
# The script expects docker-compose.blue.yml and docker-compose.green.yml
# to exist alongside this script's parent directory.

set -euo pipefail

IMAGE_TAG="${1:-latest}"
APP_IMAGE="stellar-spend:${IMAGE_TAG}"
HEALTH_URL="http://localhost"
HEALTH_RETRIES=10
HEALTH_INTERVAL=5  # seconds between retries

# Determine which environment is currently active
active_env() {
  if docker compose -f docker-compose.blue.yml ps --status running 2>/dev/null | grep -q "Up"; then
    echo "blue"
  else
    echo "green"
  fi
}

health_check() {
  local port="$1"
  local url="${HEALTH_URL}:${port}/api/health"
  for i in $(seq 1 "$HEALTH_RETRIES"); do
    if curl -sf "$url" | grep -q '"status":"ok"'; then
      echo "  Health check passed on port ${port}"
      return 0
    fi
    echo "  Attempt ${i}/${HEALTH_RETRIES}: waiting ${HEALTH_INTERVAL}s..."
    sleep "$HEALTH_INTERVAL"
  done
  echo "  ERROR: Health check failed after ${HEALTH_RETRIES} attempts on port ${port}" >&2
  return 1
}

CURRENT=$(active_env)
if [ "$CURRENT" = "blue" ]; then
  NEXT="green"
  NEXT_PORT=3001
  CURRENT_PORT=3000
else
  NEXT="blue"
  NEXT_PORT=3000
  CURRENT_PORT=3001
fi

echo "==> Current active environment: ${CURRENT} (port ${CURRENT_PORT})"
echo "==> Deploying to: ${NEXT} (port ${NEXT_PORT})"

# 1. Pull / build the new image
echo "==> Building image ${APP_IMAGE}..."
docker build -t "$APP_IMAGE" .

# 2. Start the new (inactive) environment
echo "==> Starting ${NEXT} environment..."
IMAGE_TAG="$IMAGE_TAG" docker compose -f "docker-compose.${NEXT}.yml" up -d

# 3. Health-check the new environment
echo "==> Running health checks on ${NEXT}..."
if ! health_check "$NEXT_PORT"; then
  echo "==> ROLLBACK: ${NEXT} failed health checks. Stopping it."
  docker compose -f "docker-compose.${NEXT}.yml" down
  exit 1
fi

# 4. Switch traffic (update the nginx/proxy upstream or DNS)
echo "==> Switching traffic to ${NEXT} (port ${NEXT_PORT})..."
# If using nginx, reload its config here, e.g.:
#   sed -i "s/proxy_pass http:\/\/localhost:[0-9]*/proxy_pass http:\/\/localhost:${NEXT_PORT}/" /etc/nginx/conf.d/stellar-spend.conf
#   nginx -s reload
# For a simple single-host setup, update the .active symlink:
echo "$NEXT" > .active-env
echo "==> Traffic switched to ${NEXT}"

# 5. Stop the old environment
echo "==> Stopping old environment: ${CURRENT}..."
docker compose -f "docker-compose.${CURRENT}.yml" down

echo "==> Deployment complete. Active: ${NEXT} on port ${NEXT_PORT}"
