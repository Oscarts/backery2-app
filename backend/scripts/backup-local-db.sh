#!/bin/bash
# Automated PostgreSQL backup script for local development
# Run this daily via cron: 0 2 * * * /Users/oscar/backery2-app/backend/scripts/backup-local-db.sh

set -e

# Configuration
DB_NAME="bakery_inventory"
DB_USER="oscar"
BACKUP_DIR="/Users/oscar/backups/bakery_inventory"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"
MAX_BACKUPS=7  # Keep last 7 backups

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting backup of $DB_NAME..."

# Create backup
pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

echo "✅ Backup created: $BACKUP_FILE"

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📦 Size: $BACKUP_SIZE"

# Clean old backups (keep only last MAX_BACKUPS)
echo "🧹 Cleaning old backups (keeping last $MAX_BACKUPS)..."
cd "$BACKUP_DIR"
ls -t backup_*.sql.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm -f

# List remaining backups
echo "📋 Available backups:"
ls -lh backup_*.sql.gz 2>/dev/null || echo "   (no backups found)"

echo "✅ Backup completed successfully!"
