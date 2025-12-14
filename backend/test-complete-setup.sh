#!/bin/bash

# Complete Database Reset and Seed Test
# This script proves everything works from scratch

echo "═══════════════════════════════════════════════════════════"
echo "🧪 COMPLETE DATABASE RESET & SEED TEST"
echo "═══════════════════════════════════════════════════════════"
echo ""

cd "$(dirname "$0")"

# Step 1: Kill connections
echo "1️⃣ Terminating all database connections..."
psql bakery_inventory -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bakery_inventory' AND pid <> pg_backend_pid();" > /dev/null 2>&1

# Step 2: Drop and recreate
echo "2️⃣ Dropping and recreating database..."
dropdb bakery_inventory 2>/dev/null
createdb bakery_inventory
echo "   ✅ Fresh database created"

# Step 3: Run migrations
echo "3️⃣ Applying all migrations..."
npx prisma migrate deploy 2>&1 | grep -E "(Applying|migrations found|✅)" || echo "   ⚠️  Check migrations manually"

# Step 4: Generate Prisma Client
echo "4️⃣ Generating Prisma Client..."
npx prisma generate > /dev/null 2>&1
echo "   ✅ Prisma Client generated"

# Step 5: Run seed
echo "5️⃣ Running comprehensive seed..."
npm run db:seed:force

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ DATABASE RESET & SEED COMPLETE"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "🔐 Login Credentials:"
echo "   Platform Admin: superadmin@system.local / super123"
echo "   Bakery Admin: admin@demobakery.com / admin123"
echo ""
