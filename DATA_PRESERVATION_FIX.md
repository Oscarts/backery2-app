# Data Preservation Fix - January 24, 2026

## Problem Identified

The `start-with-data.sh` script was not properly preserving user data between sessions. Issues:

1. **Flawed seed check**: Checked only for `category` count, which could exist even after migrations reset other tables
2. **Missing SKU mappings**: Seed file didn't create SKU mappings, so they appeared empty after restarts
3. **Inconsistent behavior**: Script would sometimes seed, sometimes not, depending on partial data state

## Solutions Implemented

### 1. Fixed `start-with-data.sh` Script

**Key improvements:**
- ✅ Changed check from `category` count to `client` count (more reliable indicator of seeded data)
- ✅ Uses `prisma migrate deploy` (non-destructive, only applies new migrations)
- ✅ Clear messaging: Shows client count and reminds user about reset option
- ✅ Only seeds when database is completely empty (`client` count = 0)
- ✅ Better error messages and PostgreSQL connection checks

**Usage:**
```bash
./start-with-data.sh    # Daily development - preserves ALL your data
```

### 2. Enhanced Seed File (`backend/prisma/seed.ts`)

**Automatic SKU Mapping creation:**
- ✅ Creates SKU mappings for all raw materials (3 items)
- ✅ Creates SKU mappings for all finished products (3 items)
- ✅ Total: 6 SKU reference items automatically created
- ✅ No manual backfill needed

**What gets seeded:**
- 2 Clients (System + Demo Bakery)
- 2 Users (superadmin + bakery admin)
- 8 Categories
- 3 Suppliers
- 4 Storage Locations
- 21 Units
- 3 Quality Statuses
- 2 Recipes
- 3 Raw Materials
- 3 Finished Products
- **6 SKU Mappings** (NEW!)
- 5 Role Templates

### 3. Backup Backfill Script

Created `backend/backfill-sku-references.ts` for edge cases:
- Use when manually fixing SKU mappings
- Processes all clients automatically
- Skips existing entries
- Useful after manual database operations

```bash
cd backend && npx ts-node backfill-sku-references.ts
```

## Script Comparison

| Script | Purpose | Data Handling | When to Use |
|--------|---------|---------------|-------------|
| `start-with-data.sh` | Daily development | **Preserves ALL data** | Every day, default choice |
| `reset-and-start.sh` | Fresh start | **Deletes ALL data** | Only when troubleshooting |
| `npm run dev` | Just start servers | No database changes | When already set up |

## Testing the Fix

1. **Start with the improved script:**
```bash
./start-with-data.sh
```

2. **Verify data preservation:**
- Login: admin@demobakery.com / admin123
- Navigate to SKU References page
- Should see 6 items (3 raw materials + 3 finished products)
- Categories dropdown should show 8 categories

3. **Create test data:**
- Add a new SKU reference
- Add a new raw material
- Stop servers (Ctrl+C)

4. **Restart and verify:**
```bash
./start-with-data.sh
```
- Your test data should still be there
- Script should say: "✅ Database contains data (2 clients). Preserving existing data."

## Benefits

✅ **Predictable behavior**: Clear distinction between preserve and reset
✅ **No data loss**: User-created data persists across sessions
✅ **Complete setup**: SKU mappings created automatically
✅ **Better DX**: Clear messages about what's happening
✅ **Production-ready**: Follows industry best practices for data safety

## Senior Dev Best Practices Applied

1. **Idempotency**: Script can run multiple times safely
2. **Clear separation**: Destructive vs non-destructive operations
3. **Fail-fast**: Checks prerequisites before proceeding
4. **Informative**: User always knows what's happening
5. **Safe defaults**: Default behavior (start-with-data) is non-destructive
6. **Minimal dependencies**: Works even without `jq` installed
