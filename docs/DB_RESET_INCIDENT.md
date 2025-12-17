## Database Reset Incident & Remediation

Summary
-------
- Date: 2025-12-17
- Context: Attempt to run `npx prisma migrate reset --force --skip-generate` during a local reinit. A migration failed with error: `relation "categories" already exists` (P3018 / 42P07).

What I did
-----------
1. Created a manual backup of the local database using `backend/scripts/backup-local-db.sh` (output saved under `/Users/oscar/backups/bakery_inventory/`).
2. Investigated the failing migration: `backend/prisma/migrations/20251216000000_restore_categories_table/migration.sql` — it attempted to `CREATE TABLE "categories"` without guarding for existing relation.
3. Made the migration SQL idempotent by wrapping table/index/constraint creation in `DO $$ BEGIN IF NOT EXISTS (...) THEN ... END IF; END$$;` blocks. This prevents errors when the schema already contains the object.
4. Recreated the `bakery_inventory` database and applied all migrations with `npx prisma migrate deploy`.
5. Ran the forced seed: `npm run db:seed:force`.

Why this happened
-----------------
- Migrations were not fully idempotent: some migration SQL attempted to create objects that already existed in the target DB.
- During a reset, the migration engine expects to be able to create objects without conflicts; when a previous step left the DB in a state where the object exists, the migration fails.

Permanent fixes applied
-----------------------
- Patched `backend/prisma/migrations/20251216000000_restore_categories_table/migration.sql` to be idempotent (wrap CREATE TABLE/CREATE INDEX/ALTER TABLE add constraint in IF NOT EXISTS checks).

Recommendations to avoid recurrence
----------------------------------
1. Keep migration SQL idempotent where possible (use `IF NOT EXISTS` checks for DDL).
2. Prefer `npx prisma migrate deploy` for applying known-good migrations and `npx prisma migrate reset` only when you intentionally want a destructive reset.
3. Always create a backup before destructive operations (use `npm run db:backup`).
4. Use the included `scripts/archive-deprecated.sh` to archive temporary verification/debug scripts and temporal docs before running large operations (these files can introduce unexpected code paths during manual runs).
5. Review migrations for data-migration steps that assume a particular state; add defensive checks or split into smaller migrations.

Commands used (for reproducibility)
---------------------------------
```bash
# Backup
cd backend && npm run db:backup

# (Optional) recreate DB cleanly
psql -U <user> -h localhost -d postgres -c "DROP DATABASE IF EXISTS \"bakery_inventory\";"
psql -U <user> -h localhost -d postgres -c "CREATE DATABASE \"bakery_inventory\";"

# Apply migrations (non-interactive)
cd backend && npx prisma migrate deploy --schema prisma/schema.prisma

# Run forced seed
cd backend && npm run db:seed:force

# Archive deprecated scripts (recommended)
./scripts/archive-deprecated.sh
```

Files changed
-------------
- `backend/prisma/migrations/20251216000000_restore_categories_table/migration.sql` — made idempotent.
- Added `scripts/archive-deprecated.sh` to archive deprecated files safely.

If you want, I can commit these changes and open a PR with the DB incident notes. Also can run the archive script to tidy up the repo now — confirm if you want me to run it and commit the removals.
