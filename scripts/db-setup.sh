#!/usr/bin/env bash
# ── Lendora XAMPP first-run database setup ────────────────────────────────────
# Run this once after cloning the repo on a Windows XAMPP machine.
# Assumes XAMPP MySQL is running on localhost:3306.
#
# Usage: bash scripts/db-setup.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Load .env if present
if [ -f ".env" ]; then
  set -a; source .env; set +a
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-lendora}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"

echo "==> [db-setup] Host=${DB_HOST}:${DB_PORT} DB=${DB_NAME} User=${DB_USER}"

# ── 1. Create database ─────────────────────────────────────────────────────────
echo "==> [mysql] Creating database '${DB_NAME}'"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" ${DB_PASS:+-p"$DB_PASS"} \
  -e "CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# ── 2. Install dependencies ────────────────────────────────────────────────────
echo "==> [pnpm] Installing dependencies"
pnpm install --frozen-lockfile

# ── 3. Generate Prisma client ──────────────────────────────────────────────────
echo "==> [prisma] Generating client"
pnpm --filter @lendora/database run db:generate

# ── 4. Run migrations ──────────────────────────────────────────────────────────
echo "==> [prisma] Deploying migrations"
pnpm --filter @lendora/database run db:deploy

# ── 5. Seed reference data (categories, admin account) ────────────────────────
echo "==> [prisma] Seeding database"
pnpm --filter @lendora/database run db:seed 2>/dev/null || echo "    (no seed script — skipping)"

echo "==> [db-setup] Complete. DATABASE_URL=${DATABASE_URL:-not set}"
