-- Migration: Drop legacy unique constraint or index on finished_products.sku if it still exists
-- Safe for repeated runs (PostgreSQL)

DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find a unique constraint directly on sku
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    WHERE rel.relname = 'finished_products'
      AND nsp.nspname = current_schema()
      AND att.attname = 'sku'
      AND con.contype = 'u'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE finished_products DROP CONSTRAINT %I', constraint_name);
    END IF;

    -- Also attempt to drop any standalone unique index (older Prisma versions might have created like finished_products_sku_key)
    PERFORM 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'finished_products_sku_key';
    IF FOUND THEN
        EXECUTE 'DROP INDEX finished_products_sku_key';
    END IF;
END $$;
