#!/usr/bin/env bash
# Canonical DB reinitialization script (non-interactive, safe, repeatable)
# Usage: run from repo root: `bash scripts/reinit-db.sh`
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
DB_NAME="bakery_inventory"
DB_USER="${PGUSER:-$USER}"
DB_HOST="localhost"

if [[ "${NODE_ENV:-development}" == "production" ]]; then
  echo "ERROR: NODE_ENV=production — aborting for safety"
  exit 1
fi

echo "1) Backing up current local DB"
cd "$BACKEND_DIR"
npm run db:backup

echo "2) Terminating other connections to $DB_NAME"
psql -U "$DB_USER" -h "$DB_HOST" -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();"

echo "3) Dropping and recreating $DB_NAME"
psql -U "$DB_USER" -h "$DB_HOST" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
psql -U "$DB_USER" -h "$DB_HOST" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"

echo "4) Applying migrations (non-interactive)"
npx prisma migrate deploy --schema prisma/schema.prisma

echo "5) Running forced seed"
npm run db:seed:force

echo "✅ Reinit complete — DB migrated and seeded"
echo "Backups stored under: /Users/oscar/backups/bakery_inventory/"
