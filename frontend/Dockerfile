# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json                ./frontend/
COPY packages/shared/package.json         ./packages/shared/
COPY packages/config/package.json         ./packages/config/
RUN pnpm install --frozen-lockfile

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .

# Build shared packages first
RUN pnpm --filter @lendora/shared  run build
RUN pnpm --filter @lendora/config  run build 2>/dev/null || true

# Emit standalone output so the runner stage needs no node_modules
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @lendora/frontend run build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Standalone output embeds its own server — copy the minimal set
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static     ./frontend/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/frontend/public           ./frontend/public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/healthz || exit 1

CMD ["node", "frontend/server.js"]
