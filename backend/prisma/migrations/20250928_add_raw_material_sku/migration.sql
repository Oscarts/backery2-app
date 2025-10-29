-- Add sku column to raw_materials and backfill based on name slug
ALTER TABLE "raw_materials" ADD COLUMN "sku" TEXT;

-- Backfill: generate uppercase slug (non-alphanumeric -> '-')
UPDATE "raw_materials" SET "sku" = UPPER(REGEXP_REPLACE(name, '[^A-Za-z0-9]+', '-', 'g')) WHERE "sku" IS NULL;

-- Optional: create index to speed lookup by name for SKU reuse
CREATE INDEX IF NOT EXISTS raw_materials_name_idx ON "raw_materials"(name);
