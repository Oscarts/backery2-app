#!/bin/bash
# =============================================================================
# RapidPro Database Restore Script
# =============================================================================
# Usage: ./scripts/restore-backup.sh <backup_file.sql.gz>
# 
# This script restores a database backup from a GitHub release
# It can restore from a local .sql.gz file or download from GitHub releases
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          RapidPro Database Restore Utility                ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <backup_file.sql.gz>${NC}"
    echo ""
    echo "Options:"
    echo "  1. Provide a local backup file: ./scripts/restore-backup.sh backup.sql.gz"
    echo "  2. Download latest from GitHub: ./scripts/restore-backup.sh --latest"
    echo ""
    exit 1
fi

# Check for required environment variable
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ ERROR: DATABASE_URL environment variable is not set${NC}"
    echo ""
    echo "Set it with: export DATABASE_URL='postgresql://user:pass@host:5432/db'"
    exit 1
fi

BACKUP_FILE=$1

# If --latest flag, download from GitHub
if [ "$1" == "--latest" ]; then
    echo -e "${BLUE}📥 Downloading latest backup from GitHub releases...${NC}"
    
    # Get the latest release with backup- tag
    LATEST_RELEASE=$(curl -s "https://api.github.com/repos/Oscarts/backery2-app/releases" | \
        grep -o '"tag_name": "backup-[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -z "$LATEST_RELEASE" ]; then
        echo -e "${RED}❌ No backup releases found${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Found latest backup: $LATEST_RELEASE${NC}"
    
    # Download the backup file
    DOWNLOAD_URL=$(curl -s "https://api.github.com/repos/Oscarts/backery2-app/releases/tags/$LATEST_RELEASE" | \
        grep -o '"browser_download_url": "[^"]*\.sql\.gz"' | cut -d'"' -f4)
    
    if [ -z "$DOWNLOAD_URL" ]; then
        echo -e "${RED}❌ Could not find backup file in release${NC}"
        exit 1
    fi
    
    BACKUP_FILE="downloaded_backup.sql.gz"
    curl -L -o "$BACKUP_FILE" "$DOWNLOAD_URL"
    echo -e "${GREEN}✅ Downloaded backup to $BACKUP_FILE${NC}"
fi

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ ERROR: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  WARNING: This will OVERWRITE the current database!${NC}"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔄 Starting database restore...${NC}"

# Decompress and restore
echo -e "${BLUE}📦 Decompressing backup...${NC}"
gunzip -c "$BACKUP_FILE" > temp_restore.sql

echo -e "${BLUE}🗄️ Restoring database...${NC}"
psql "$DATABASE_URL" < temp_restore.sql

# Cleanup
rm temp_restore.sql
if [ "$1" == "--latest" ]; then
    rm "$BACKUP_FILE"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✅ Database restored successfully!               ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Verify the data: npx prisma studio"
echo "  2. Run any pending migrations: npx prisma migrate deploy"
echo ""
