# Database Safety & Backup System

## 🚨 Quick Reference Card

### Restore Database
```bash
# 1. List backups
npm run db:restore

# 2. Pick a backup and restore it
npm run db:restore /Users/oscar/backups/bakery_inventory/backup_YYYYMMDD_HHMMSS.sql.gz
```

### Backup Schedule
- **Automatic**: Every day at 2:00 AM ✅ 
- **Manual**: `npm run db:backup`
- **Retention**: Last 7 days
- **Location**: `/Users/oscar/backups/bakery_inventory/`

### Emergency Recovery
1. Stop what you're doing
2. Run: `npm run db:restore`
3. Choose the most recent backup
4. Type "RESTORE" when prompted

---

## ⚠️ IMPORTANT: Data Loss Prevention

This document explains the safety measures implemented to prevent accidental data loss.

---

## 🛡️ Safety Features

### 1. Protected Seed Script

The main seed script (`prisma/seed.ts`) now has safety checks:

- **Interactive Confirmation**: For localhost databases, you must type "DELETE ALL DATA" to proceed
- **Force Flag**: Use `--force` flag to skip confirmation (use with caution)
- **Auto-proceed**: CI/Production environments automatically proceed

**Usage:**
```bash
# Will ask for confirmation
npm run db:seed

# Skip confirmation (dangerous!)
npm run db:seed:force
```

### 2. Safe Development Seed

A new `seed-dev.ts` script that **NEVER deletes data**:

- Checks if users exist before creating
- Adds missing data without wiping
- Safe to run multiple times
- Perfect for development

**Usage:**
```bash
npm run db:seed:dev
```

### 3. Automated Backups

**Manual Backup Command:**
```bash
npm run db:backup
```

This creates a compressed backup in `/Users/oscar/backups/bakery_inventory/` with:
- Timestamp in filename
- Automatic compression (gzip)
- Keeps last 7 backups
- Shows backup size

**✅ Automatic Daily Backups (CONFIGURED)**

Your database is now automatically backed up **every day at 2:00 AM**.

To view the cron job:
```bash
crontab -l
```

To check backup logs:
```bash
tail -f /Users/oscar/backups/bakery_inventory/backup.log
```

**Backup Schedule:**
- **Frequency**: Daily at 2:00 AM
- **Retention**: Last 7 backups (1 week)
- **Location**: `/Users/oscar/backups/bakery_inventory/`
- **Format**: Compressed SQL (`.sql.gz`)

### 4. Database Restore

**Step 1: List Available Backups:**
```bash
npm run db:restore
```

This shows all backups with dates and sizes:
```
📋 Available backups in /Users/oscar/backups/bakery_inventory:

-rw-r--r--  1 oscar  staff  8.7K Dec 13 17:54 backup_20251213_175444.sql.gz
-rw-r--r--  1 oscar  staff  8.6K Dec 13 17:51 backup_20251213_175110.sql.gz

Usage: ./restore-local-db.sh <backup-file>
```

**Step 2: Restore from Backup:**
```bash
npm run db:restore /Users/oscar/backups/bakery_inventory/backup_20251213_175444.sql.gz
```

**Safety Features:**
- Requires typing "RESTORE" to confirm
- Creates a pre-restore safety backup automatically
- Shows clear warnings before wiping data
- Keeps the safety backup in case you need to undo

**Example Restore Session:**
```
⚠️  WARNING: This will REPLACE ALL DATA in database: bakery_inventory
Type 'RESTORE' to confirm: RESTORE

🔒 Creating safety backup first: pre-restore_20251213_180000.sql.gz
📥 Restoring data...
✅ Database restored successfully!
🔒 Safety backup saved at: /Users/oscar/backups/bakery_inventory/pre-restore_20251213_180000.sql.gz
```

---

## 📝 Current User Accounts

### Local Development Users

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@demobakery.com` | `admin123` | ADMIN | Main demo admin |
| `admin@test.com` | `test123` | ADMIN | Testing admin |
| `superadmin@system.local` | `super123` | ADMIN | Super admin |
| `manager@test.com` | `manager123` | MANAGER | Manager testing |
| `staff@test.com` | `staff123` | STAFF | Staff testing |

### Production Users

| Email | Password | Role |
|-------|----------|------|
| `admin@demobakery.com` | `admin123` | ADMIN |
| `superadmin@rapidpro.app` | `SuperAdmin2025!` | ADMIN |

---

## 🔒 Environment Protection

The `.env` file now includes:
```bash
PROTECT_DATABASE=true
```

This flag is used by scripts to identify protected databases.

---

## 📋 Quick Reference

### Common Commands

```bash
# Safe development seed (no data loss)
npm run db:seed:dev

# Backup database NOW
npm run db:backup

# List available backups
npm run db:restore

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio
npm run db:studio
```

### Emergency Recovery

If you accidentally wipe data:

1. **Stop immediately** - Don't run any more commands
2. **Check backups**: `npm run db:restore`
3. **Restore latest**: `npm run db:restore /path/to/backup.sql.gz`

### Before Dangerous Operations

Always backup first:
```bash
npm run db:backup && npm run db:seed
```

---

## 🎯 Best Practices

1. **Backup before migrations**: `npm run db:backup`
2. **Use seed-dev for testing**: Never use main seed in development
3. **Set up cron for daily backups**: See instructions above
4. **Never commit `.env`**: It contains your production credentials
5. **Test restore process**: Practice restoring from backup before you need it

---

## 🚨 What Changed?

### Previous Behavior (DANGEROUS)
- `npx prisma db seed` would **immediately wipe all data**
- No confirmation, no warning
- Lost all users, recipes, inventory

### New Behavior (SAFE)
- Requires explicit confirmation for localhost
- Separate safe seed script for development  
- Automated backups available
- Easy restore process

---

## 💡 Tips

- **First backup is already done**: Check `/Users/oscar/backups/bakery_inventory/`
- **Test credentials after restore**: Login to verify data integrity
- **Backup before major changes**: Migrations, schema updates, bulk imports
- **Keep at least one good backup**: Don't let all backups expire

---

## 📞 Support

If something goes wrong:
1. Don't panic
2. Check `/Users/oscar/backups/bakery_inventory/` for backups
3. Review this document
4. Restore from the most recent good backup

---

**Last Updated**: December 13, 2025  
**Backup Location**: `/Users/oscar/backups/bakery_inventory/`  
**Database**: `postgresql://oscar@localhost:5432/bakery_inventory`
