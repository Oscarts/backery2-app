# Database Seed Files - Cleanup Required

## ⚠️ Status: Multiple conflicting seed files detected!

### 🎯 **OFFICIAL SEED FILE (Use This One)**
```
✅ prisma/seed.ts - Production-ready, comprehensive seed
```

### ❌ **OLD FILES TO DELETE** (These cause confusion)

**In backend/ directory:**
- `seed-basic.js` - Old basic seed (outdated)
- `seed-standard-units.js` - Now integrated into main seed
- `seed-customer-orders.ts` - Test file, no longer needed
- `seed-customer-orders-simple.ts` - Test file, no longer needed
- `seed-quick.ts` - Deprecated
- `seed-realistic-data.ts` - Old version
- `seed-realistic-data-fixed.ts` - Old version

**In backend/prisma/ directory:**
- `seed-dev.ts` - Partial seed, causes confusion
- `seed-multi-tenant.ts` - Now integrated into main seed.ts

### ✅ **Cleanup Commands**

```bash
cd backend

# Remove old seed files
rm -f seed-basic.js
rm -f seed-standard-units.js
rm -f seed-customer-orders.ts
rm -f seed-customer-orders-simple.ts
rm -f seed-quick.ts
rm -f seed-realistic-data.ts
rm -f seed-realistic-data-fixed.ts
rm -f prisma/seed-dev.ts
rm -f prisma/seed-multi-tenant.ts

# Remove the old script reference from package.json
# (Manual edit needed - remove "db:seed:dev" line)
```

### 📝 **Update package.json**

Remove this line:
```json
"db:seed:dev": "tsx prisma/seed-dev.ts",
```

### ✅ **After Cleanup - Single Source of Truth**

**Only ONE seed file:**
- `prisma/seed.ts` - Complete, tested, production-ready

**Usage:**
```bash
# With confirmation prompt
npm run db:seed

# Skip confirmation (set SKIP_CONFIRM=true in .env)
npm run db:seed

# Force without prompt (one-time)
npm run db:seed:force
```

## 🎓 **For New Developers**

After cleanup, the workflow is crystal clear:
1. Clone repo
2. Run `npm install` in backend
3. Run `npm run db:seed` (or set SKIP_CONFIRM=true)
4. Done! Everything is seeded.

No confusion, no old files, no alternative methods.
