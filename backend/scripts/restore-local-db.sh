#!/bin/bash
# Restore PostgreSQL database from backup
# Usage: ./restore-local-db.sh [backup-file]
#
# If no backup file is specified, lists available backups

set -e

DB_NAME="bakery_inventory"
DB_USER="oscar"
BACKUP_DIR="/Users/oscar/backups/bakery_inventory"

if [ -z "$1" ]; then
  echo "📋 Available backups in $BACKUP_DIR:"
  echo ""
  ls -lht "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -10 || echo "   No backups found"
  echo ""
  echo "Usage: $0 <backup-file>"
  echo "Example: $0 $BACKUP_DIR/backup_20251213_150000.sql.gz"
  exit 0
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  ═══════════════════════════════════════════════════════════"
echo "⚠️  WARNING: This will REPLACE ALL DATA in database: $DB_NAME"
echo "⚠️  ═══════════════════════════════════════════════════════════"
echo ""
read -p "Type 'RESTORE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESTORE" ]; then
  echo "❌ Cancelled - no changes made"
  exit 0
fi

echo ""
echo "🔄 Restoring database from backup..."
echo "📁 Source: $BACKUP_FILE"

# Create a safety backup before restore
SAFETY_BACKUP="$BACKUP_DIR/pre-restore_$(date +%Y%m%d_%H%M%S).sql.gz"
echo "🔒 Creating safety backup first: $SAFETY_BACKUP"
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$SAFETY_BACKUP"

# Restore from backup
echo "📥 Restoring data..."
gunzip -c "$BACKUP_FILE" | psql -U "$DB_USER" "$DB_NAME"

echo ""
echo "✅ Database restored successfully!"
echo "🔒 Safety backup saved at: $SAFETY_BACKUP"
