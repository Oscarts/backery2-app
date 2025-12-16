# Contributing to Bakery Inventory Management System

## 🎯 Project Maintenance Philosophy

**Less is More**: We maintain a clean, focused codebase with essential documentation only.

## 📝 Documentation Guidelines

### What to Keep

✅ **Essential Documentation** (Always keep):
- `README.md` - Project overview and quick start
- `CODE_GUIDELINES.md` - Security and data safety rules
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `DATABASE_SAFETY.md` - Backup/restore procedures
- `FEATURES.md` - Feature list

✅ **Implementation Guides** (Keep if actively used):
- `*_QUICK_START.md` - Getting started guides
- `*_IMPLEMENTATION_GUIDE.md` - Feature implementation docs
- `*_TESTING_GUIDE.md` - Testing procedures
- `*_SYSTEM.md` - System architecture docs

✅ **Technical Documentation** (Keep in `/docs`):
- API reference
- Development guidelines
- Technical architecture
- UI/UX guidelines

### What to Remove/Archive

❌ **Never Commit These**:
- `*_PROGRESS.md` - Temporal progress tracking
- `*_STATUS.md` - Status reports
- `*_SUMMARY.md` - Work summaries
- `*_COMPLETE.md` - Completion reports
- `*_FINISHED.md` - Finish reports
- `*_FINAL.md` - Final reports
- `*_VERIFICATION.md` - Verification scripts
- `*_AUDIT.md` - Audit reports
- `*_FIX_COMPLETE.md` - Fix completion reports
- `*_PROMPT.md` - Agent prompts
- `AGENT_*.md` - Agent instructions

❌ **Verification/Debug Scripts** (Root `.js` files):
- `check-*.js` - Verification scripts
- `debug-*.js` - Debug scripts
- `final-*.js` - Final verification scripts
- `advanced-*-audit.js` - Audit scripts
- `api-test-*.js` - Temporary API test scripts

### Archiving Process

When cleaning up, **archive instead of delete**:

```bash
# Archive documentation
cd /path/to/project
mkdir -p docs/archive-$(date +%Y%m%d)
mv TEMPORAL_FILE.md docs/archive-$(date +%Y%m%d)/

# Archive scripts
mkdir -p scripts/archive-$(date +%Y%m%d)
mv check-something.js scripts/archive-$(date +%Y%m%d)/
```

**Archive locations**:
- Documentation: `docs/archive-YYYYMMDD/`
- Scripts: `scripts/archive-YYYYMMDD/`

## 🗂️ File Organization

### Root Directory Structure

```
backery2-app/
├── README.md                  # Project overview
├── CODE_GUIDELINES.md         # Security rules
├── DEPLOYMENT_GUIDE.md        # Deployment guide
├── DATABASE_SAFETY.md         # Backup procedures
├── FEATURES.md                # Feature list
├── *_QUICK_START.md          # Feature guides (keep few)
├── *_IMPLEMENTATION_GUIDE.md # Implementation docs
├── backend/                   # Backend code
├── frontend/                  # Frontend code
├── docs/                      # Technical documentation
│   └── archive-*/            # Archived docs
└── scripts/                   # Utility scripts
    ├── *.js                  # Active scripts only
    └── archive-*/            # Archived scripts
```

### Backend Organization

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # SINGLE seed file
│   └── migrations/           # Migration history
├── src/                      # Application code
├── SEED_SYSTEM_VERIFIED.md   # Seed documentation
└── test-*.sh                 # Test scripts
```

**Never have**:
- Multiple seed files (only `seed.ts`)
- Old migrations with same name
- Verification scripts in root

## 🔧 Code Contribution Guidelines

### Before Making Changes

1. **Read documentation in order**:
   - CODE_GUIDELINES.md (security first!)
   - docs/development-guidelines.md
   - docs/technical-architecture.md
   - Feature-specific guides

2. **Check for existing patterns**:
   ```bash
   # Search for similar implementations
   cd backend && grep -r "similar_pattern" src/
   ```

3. **Run tests**:
   ```bash
   cd backend && npm test
   ```

### Making Changes

✅ **DO**:
- Follow existing code patterns
- Write tests for new features
- Update relevant documentation
- Use descriptive commit messages
- Filter by `clientId` in ALL database queries (multi-tenant security!)

❌ **DON'T**:
- Create new seed files (modify `seed.ts` only)
- Bypass `clientId` filters (security risk!)
- Leave debug/test files in root
- Create progress/status documentation
- Use `findUnique` without `clientId` filter

### Multi-Tenant Security (CRITICAL!)

**ALWAYS filter by `clientId`**:

```typescript
// ✅ CORRECT - Tenant-safe
const items = await prisma.rawMaterial.findMany({
  where: { clientId: req.user!.clientId, /* filters */ }
});

// ❌ WRONG - Security vulnerability!
const items = await prisma.rawMaterial.findMany({
  where: { /* missing clientId */ }
});
```

### Database Changes

**Never run destructive operations without confirmation**:

```bash
# Check current data first
cd backend && npm run db:check

# Backup before risky operations
npm run db:backup

# Use protected seed
PROTECT_DATABASE=true npm run db:seed
```

### Testing Requirements

All features must have tests:

```bash
# Run backend tests
cd backend && npm test

# Run specific test
npx jest test-production-workflow.js

# With coverage
npm run test:coverage
```

## 📋 Pull Request Checklist

Before submitting a PR:

- [ ] Code follows existing patterns
- [ ] All database queries filter by `clientId`
- [ ] Tests written and passing
- [ ] No new seed files created
- [ ] No verification/debug scripts in root
- [ ] No progress/status docs created
- [ ] Documentation updated (if needed)
- [ ] `npm test` passes
- [ ] No console.log() or debug code left

## 🧹 Periodic Cleanup

**Monthly maintenance** (first Monday of month):

```bash
# 1. Review root directory
ls -la *.md *.js | wc -l  # Should be < 30 files

# 2. Archive temporal files
./cleanup-temporal-docs.sh

# 3. Check for duplicate migrations
cd backend/prisma/migrations && ls -la | grep "duplicate_name"

# 4. Verify single seed file
ls -la backend/prisma/seed* backend/seed*  # Should only show seed.ts

# 5. Remove old archives (older than 3 months)
find docs/archive-* scripts/archive-* -type d -mtime +90 -exec rm -rf {} \;
```

## 🚨 Emergency Procedures

### Accidental Data Loss

1. **Stop immediately**
2. **Don't run any more commands**
3. **Restore from backup**:
   ```bash
   cd backend
   npm run db:restore  # Lists available backups
   npm run db:restore /path/to/backup.sql.gz
   ```

### Migration Conflicts

1. **Check migration status**:
   ```bash
   cd backend
   npx prisma migrate status
   ```

2. **Resolve conflicts**:
   ```bash
   # Mark problematic migration as rolled back
   npx prisma migrate resolve --rolled-back "migration_name"
   ```

3. **Reapply migrations**:
   ```bash
   npx prisma migrate deploy
   ```

### Seed System Issues

1. **Verify seed file**:
   ```bash
   cd backend
   ls -la prisma/seed* seed*  # Should only show prisma/seed.ts
   ```

2. **Fix if multiple seed files exist**:
   ```bash
   # Keep only prisma/seed.ts, archive others
   mkdir -p scripts/archive-$(date +%Y%m%d)
   mv seed-*.{js,ts} scripts/archive-$(date +%Y%m%d)/
   ```

3. **Test seed**:
   ```bash
   npm run db:seed:force
   ```

## 📞 Getting Help

1. **Check documentation** (in order):
   - README.md
   - CODE_GUIDELINES.md
   - Feature-specific guides
   - docs/

2. **Search archived docs**:
   ```bash
   grep -r "search_term" docs/archive-*
   ```

3. **Review git history**:
   ```bash
   git log --all --grep="relevant_keyword"
   ```

## 🎓 Best Practices

### Code Quality

- **Consistent formatting**: Follow existing code style
- **Meaningful names**: `getUsersByClient()` not `getUsers()`
- **Error handling**: Always handle errors gracefully
- **Comments**: Explain why, not what
- **Security first**: Always validate and sanitize input

### Database

- **Single source of truth**: Only `backend/prisma/seed.ts`
- **Migrations**: Add `IF EXISTS` / `IF NOT EXISTS` to all DDL
- **Backups**: Before any risky operation
- **Testing**: Test migrations on backup DB first

### Documentation

- **Update as you code**: Don't leave stale docs
- **Clear examples**: Show actual code, not pseudocode
- **Single source**: Consolidate, don't duplicate
- **Delete obsolete**: Archive instead of keeping outdated docs

### Deployment Documentation

**Official Production Deployment**: [DEPLOYMENT_PRODUCTION.md](DEPLOYMENT_PRODUCTION.md)

- ✅ **Architecture**: Vercel (frontend) + Render (backend) + Neon (database)
- ✅ **Why this setup?** Independent database, free backups, better free tier limits
- ✅ **Verification**: Use `./verify-production-deployment.sh` after deployment

**Other deployment options** in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) are for development/testing only.

**Deployment documentation rules**:
1. Keep DEPLOYMENT_PRODUCTION.md as single source of truth for production
2. Update deployment docs whenever you change infrastructure
3. Archive old deployment approaches (e.g., Railway files in `docs/archive-*`)
4. Test deployment scripts before committing
5. Include verification steps in all deployment docs

---

## 🙏 Thank You!

By following these guidelines, you help keep the project clean, maintainable, and secure for everyone. 🚀
