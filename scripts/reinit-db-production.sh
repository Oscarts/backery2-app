#!/usr/bin/env bash
set -euo pipefail

# Guarded production reinit script
# This helper is intentionally strict and will refuse to run unless multiple
# explicit conditions are met to avoid accidental destructive operations.

LOGFILE="/var/log/backery2-reinit-$(date +%Y%m%d-%H%M%S).log"
echo "Starting guarded production reinit at $(date -u)" | tee -a "$LOGFILE"

if [ "${NODE_ENV:-}" != "production" ]; then
  echo "Refusing to run: NODE_ENV must be 'production'. Current: ${NODE_ENV:-<unset>}" | tee -a "$LOGFILE"
  exit 2
fi

if [ "${SKIP_CONFIRM:-}" != "true" ]; then
  echo "Refusing to run: SKIP_CONFIRM must be set to 'true' to acknowledge risk." | tee -a "$LOGFILE"
  exit 3
fi

if [ ! -f "/tmp/ALLOW_PROD_REINIT" ]; then
  echo "Refusing to run: allowfile /tmp/ALLOW_PROD_REINIT not present. Create this file on the runner after obtaining approval." | tee -a "$LOGFILE"
  exit 4
fi

if [ -z "${BACKUP_PATH:-}" ]; then
  echo "Refusing to run: BACKUP_PATH environment variable is required for audit logging." | tee -a "$LOGFILE"
  exit 5
fi

echo "Verified guard conditions. BACKUP_PATH=${BACKUP_PATH}" | tee -a "$LOGFILE"

echo "Step 1: Verify backup exists and is accessible (operator must confirm)." | tee -a "$LOGFILE"
# NOTE: the script will not attempt to create a backup automatically in production.
# It only logs the provided backup path for audit and verification.

echo "Step 2: Put system into maintenance mode (operator action required)" | tee -a "$LOGFILE"
echo "Operator must ensure maintenance mode and no scheduled jobs are running." | tee -a "$LOGFILE"

read -p "Type CONFIRM_TO_PROCEED to continue: " CONFIRM
if [ "$CONFIRM" != "CONFIRM_TO_PROCEED" ]; then
  echo "Operator did not type CONFIRM_TO_PROCEED — aborting." | tee -a "$LOGFILE"
  exit 6
fi

echo "Proceeding: applying migrations and running seed." | tee -a "$LOGFILE"

cd "$(dirname "$0")/.." || exit 1
cd backend || exit 1

echo "Running: npx prisma migrate deploy --schema prisma/schema.prisma" | tee -a "$LOGFILE"
npx prisma migrate deploy --schema prisma/schema.prisma 2>&1 | tee -a "$LOGFILE"

echo "Running: npm run db:seed:force" | tee -a "$LOGFILE"
npm run db:seed:force 2>&1 | tee -a "$LOGFILE"

echo "Production reinit completed at $(date -u). Review $LOGFILE for details." | tee -a "$LOGFILE"

exit 0
