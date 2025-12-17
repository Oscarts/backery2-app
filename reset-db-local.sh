#!/bin/bash
# reset-db-local.sh
# Safely reset and reseed the local database for Bakery Inventory Management System
# This script will DROP and RECREATE your local database, apply all migrations, and run the seed script.
# Use ONLY for local development. Do NOT use in production.

set -e

DB_NAME="bakery_inventory"
DEFAULT_DB_USER="${USER}"
read -p "Enter your PostgreSQL username [${DEFAULT_DB_USER}]: " DB_USER
DB_USER=${DB_USER:-$DEFAULT_DB_USER}
DB_HOST="localhost"

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirm environment
if [[ "$NODE_ENV" == "production" ]]; then
  echo -e "${RED}ERROR: NODE_ENV is set to 'production'. Aborting for safety.${NC}"
  exit 1
fi

echo -e "${YELLOW}WARNING: This will DROP and RECREATE your local database '$DB_NAME'!${NC}"
echo -e "${RED}ALL LOCAL DATA WILL BE LOST. This action is IRREVERSIBLE.${NC}"
echo
read -p "Type 'RESET LOCAL' to continue: " confirm
if [[ "$confirm" != "RESET LOCAL" ]]; then
  echo "Aborted. No changes made."
  exit 1
fi

# Drop and recreate the database
export PGPASSWORD="${PGPASSWORD:-}"
echo "Dropping and recreating database $DB_NAME..."
psql -U "$DB_USER" -h "$DB_HOST" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
psql -U "$DB_USER" -h "$DB_HOST" -c "CREATE DATABASE \"$DB_NAME\";"

# Run migrations and seed
cd "$(dirname "$0")/backend"
echo "Running: npx prisma migrate reset --force --skip-generate"
npx prisma migrate reset --force --skip-generate

echo -e "${YELLOW}Local database reset and reseeded successfully.${NC}"
