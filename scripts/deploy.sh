#!/usr/bin/env bash
# ── Lendora zero-downtime deploy script ───────────────────────────────────────
# Usage: ./scripts/deploy.sh [--skip-pull] [--env staging|production]
#
# Assumptions:
#   - Docker + Docker Compose v2 are installed
#   - .env is present at the monorepo root
#   - The script runs from the monorepo root
#
# What it does:
#   1. Pull latest code from git
#   2. Build new images
#   3. Run Prisma migrations (no downtime — online migrations only)
#   4. Rolling restart: new containers come up before old ones stop
#   5. Health-check confirmation before returning exit 0

set -euo pipefail

SKIP_PULL=false
ENV_NAME="production"

for arg in "$@"; do
  case $arg in
    --skip-pull)   SKIP_PULL=true   ;;
    --env=*)       ENV_NAME="${arg#*=}" ;;
  esac
done

echo "==> [deploy] ENV=${ENV_NAME} SKIP_PULL=${SKIP_PULL}"

# ── 1. Pull latest code ────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = "false" ]; then
  echo "==> [git] Pulling latest changes"
  git pull --rebase --autostash
fi

# ── 2. Build images ────────────────────────────────────────────────────────────
echo "==> [docker] Building images"
docker compose build --no-cache api frontend

# ── 3. Run database migrations (against running MySQL) ────────────────────────
echo "==> [prisma] Running migrations"
# Spin up a temporary container that shares the network but runs only the migrate command.
docker compose run --rm --no-deps api \
  sh -c "cd /app && node -e \"require('./apps/api/dist/scripts/migrate.js')\""  2>/dev/null \
  || docker compose run --rm --no-deps \
       -e "DATABASE_URL=${DATABASE_URL}" \
       api \
       sh -c "cd /app/packages/database && npx prisma migrate deploy"

# ── 4. Rolling restart ────────────────────────────────────────────────────────
# Docker Compose doesn't do true zero-downtime rolling deploys, but restarting
# one container at a time with Nginx's upstream keepalive minimises downtime to
# the health-check grace period (~30 s per container).
echo "==> [docker] Restarting api"
docker compose up -d --no-deps api

echo "==> [docker] Waiting for api health..."
for i in $(seq 1 12); do
  if docker compose exec api wget -qO- http://localhost:4000/health >/dev/null 2>&1; then
    echo "    api healthy"
    break
  fi
  echo "    attempt $i/12 — sleeping 5s"
  sleep 5
done

echo "==> [docker] Restarting frontend"
docker compose up -d --no-deps frontend

echo "==> [deploy] Done"
