# =============================================================================
# Open Osint — Next.js web app
# Multi-stage Dockerfile optimized for size and reproducibility.
#
# Build context: REPOSITORY ROOT (not apps/web/) because we need access to
# packages/* and the lockfile. Build with:
#
#   docker build -f apps/web/Dockerfile -t openosint/web:latest .
# =============================================================================

# ---------- 1. deps: install all node_modules ---------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

# Enable pnpm via corepack (no global install needed)
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

# Copy lockfile + workspace metadata first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/canvas/package.json ./packages/canvas/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/

RUN pnpm install --frozen-lockfile --prod=false

# ---------- 2. builder: compile Next.js + generate Prisma client --------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo

RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

COPY --from=deps /repo/node_modules ./node_modules
COPY . .

# Generate Prisma client for linux-musl runtime
RUN pnpm --filter @hilo/db generate

# Build Next.js (uses the standalone output for minimal runtime image)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @hilo/web build

# ---------- 3. runner: minimal runtime image ----------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone Next.js output (much smaller than copying full node_modules)
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/public ./apps/web/public 2>/dev/null || true

# Prisma client + engine for runtime
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3001

CMD ["node", "apps/web/server.js"]
