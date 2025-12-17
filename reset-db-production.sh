#!/bin/bash
# reset-db-production.sh
# Safely reset and reseed the production database for Bakery Inventory Management System
# CRITICAL: This script will ERASE ALL DATA in the production database.
# Use only if you are 100% sure. No backup will be performed.

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Confirm environment
if [[ "$NODE_ENV" != "production" ]]; then
  echo -e "${RED}ERROR: NODE_ENV is not set to 'production'. Aborting.${NC}"
  exit 1
fi

echo -e "${YELLOW}WARNING: You are about to RESET and RESEED the PRODUCTION database!${NC}"
echo -e "${RED}ALL DATA WILL BE LOST. This action is IRREVERSIBLE.${NC}"
echo
read -p "Type 'RESET PROD' to continue: " confirm
if [[ "$confirm" != "RESET PROD" ]]; then
  echo "Aborted. No changes made."
  exit 1
fi

cd "$(dirname "$0")/backend"

echo "Running: npx prisma migrate reset --force --skip-generate"
npx prisma migrate reset --force --skip-generate

echo -e "${YELLOW}Database reset and reseeded successfully in production.${NC}"
