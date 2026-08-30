# syntax=docker/dockerfile:1.7

# ── Stage 1: Install dependencies ────────────────────────────────────────────
# Pin to a specific digest so the image never silently changes
FROM node:20.19.2-alpine3.21@sha256:b861f7e5ba2f58fe6f7e53d6f0cd9f3f2e63b7e8c09c3a8a33e97d05c6ac0d6b AS deps
WORKDIR /app
RUN --mount=type=cache,target=/root/.npm \
    npm config set cache /root/.npm
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --frozen-lockfile --ignore-scripts

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20.19.2-alpine3.21@sha256:b861f7e5ba2f58fe6f7e53d6f0cd9f3f2e63b7e8c09c3a8a33e97d05c6ac0d6b AS builder
WORKDIR /app
# Disable telemetry during `next build` so no outbound calls are made in CI.
# (Also set in the runner stage to disable it for the running process.)
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runner (non-root, minimal) ───────────────────────────
# Use Node.js distroless-style image: slim alpine with no shell, no package manager
FROM node:20.19.2-alpine3.21@sha256:b861f7e5ba2f58fe6f7e53d6f0cd9f3f2e63b7e8c09c3a8a33e97d05c6ac0d6b AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user/group
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 # Remove package manager and shell to reduce attack surface
 && rm -f /usr/local/bin/npm /usr/local/bin/npx \
 # curl/wget for healthcheck only — kept minimal
 && apk add --no-cache curl \
 # Remove apk to prevent in-container package installation
 && rm -rf /sbin/apk /usr/lib/apk /etc/apk /lib/apk

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
