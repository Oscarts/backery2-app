#!/bin/bash
# Archived copy of root reset-db-local.sh
set -e

DB_NAME="bakery_inventory"
DEFAULT_DB_USER="${USER}"
read -p "Enter your PostgreSQL username [${DEFAULT_DB_USER}]: " DB_USER
DB_USER=${DB_USER:-$DEFAULT_DB_USER}
DB_HOST="localhost"

if [[ "$NODE_ENV" == "production" ]]; then
  echo "ERROR: NODE_ENV is set to 'production'. Aborting for safety."
  exit 1
fi

echo "This is an archived copy of reset-db-local.sh"
