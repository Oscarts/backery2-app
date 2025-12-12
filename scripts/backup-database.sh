#!/bin/bash
# =============================================================================
# RapidPro Manual Database Backup Script
# =============================================================================
# Usage: ./scripts/backup-database.sh
# 
# Creates a local backup of the database
# Useful for creating backups before major changes
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          RapidPro Manual Backup Utility                   ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Create backups directory if it doesn't exist
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rapidpro_backup_${TIMESTAMP}.sql"

echo -e "${BLUE}📦 Creating database backup...${NC}"
echo ""

# Create backup
pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --format=plain \
    > "$BACKUP_FILE"

# Compress
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Show result
SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo -e "${GREEN}✅ Backup created successfully!${NC}"
echo ""
echo "📁 File: $BACKUP_FILE"
echo "📊 Size: $SIZE"
echo ""
echo -e "${BLUE}To restore this backup:${NC}"
echo "  ./scripts/restore-backup.sh $BACKUP_FILE"
echo ""
