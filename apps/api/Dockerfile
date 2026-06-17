# ── Stage 1: base ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# ── Stage 2: deps ─────────────────────────────────────────────────────────────
# Install ALL dependencies (including dev) so TypeScript can compile.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json                 ./apps/api/
COPY packages/shared/package.json          ./packages/shared/
COPY packages/database/package.json        ./packages/database/
COPY packages/config/package.json          ./packages/config/
RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .

RUN pnpm --filter @lendora/database run db:generate
RUN pnpm --filter @lendora/shared   run build
RUN pnpm --filter @lendora/api      run build

# ── Stage 4: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 lendora

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json                 ./apps/api/
COPY packages/shared/package.json          ./packages/shared/
COPY packages/database/package.json        ./packages/database/
COPY packages/config/package.json          ./packages/config/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist          ./apps/api/dist
COPY --from=builder /app/packages/shared/dist   ./packages/shared/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

RUN mkdir -p ./apps/api/uploads && chown -R lendora:nodejs ./apps/api/uploads

USER lendora
EXPOSE 4000
ENV NODE_ENV=production PORT=4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
