-- Migration: Add full SKU reference entity
-- This migration extends the sku_mappings table with master template fields

-- Step 1: Add new columns (all nullable initially)
ALTER TABLE "sku_mappings" ADD COLUMN IF NOT EXISTS "unit_price" DOUBLE PRECISION;
ALTER TABLE "sku_mappings" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "sku_mappings" ADD COLUMN IF NOT EXISTS "reorder_level" DOUBLE PRECISION;
ALTER TABLE "sku_mappings" ADD COLUMN IF NOT EXISTS "storage_location_id" TEXT;
ALTER TABLE "sku_mappings" ADD COLUMN IF NOT EXISTS "category_id" TEXT;

-- Step 2: Drop the old category string column (after backing up data)
ALTER TABLE "sku_mappings" DROP COLUMN IF EXISTS "category";

-- Step 3: Add foreign key constraints
ALTER TABLE "sku_mappings" 
  ADD CONSTRAINT "sku_mappings_storage_location_id_fkey" 
  FOREIGN KEY ("storage_location_id") 
  REFERENCES "storage_locations"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

ALTER TABLE "sku_mappings" 
  ADD CONSTRAINT "sku_mappings_category_id_fkey" 
  FOREIGN KEY ("category_id") 
  REFERENCES "categories"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 4: Add indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS "sku_mappings_category_id_idx" ON "sku_mappings"("category_id");
CREATE INDEX IF NOT EXISTS "sku_mappings_storage_location_id_idx" ON "sku_mappings"("storage_location_id");

-- Step 5: Add sku_reference_id to raw_materials
ALTER TABLE "raw_materials" ADD COLUMN IF NOT EXISTS "sku_reference_id" TEXT;
CREATE INDEX IF NOT EXISTS "raw_materials_sku_reference_id_idx" ON "raw_materials"("sku_reference_id");

ALTER TABLE "raw_materials" 
  ADD CONSTRAINT "raw_materials_sku_reference_id_fkey" 
  FOREIGN KEY ("sku_reference_id") 
  REFERENCES "sku_mappings"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 6: Add sku_reference_id to finished_products
ALTER TABLE "finished_products" ADD COLUMN IF NOT EXISTS "sku_reference_id" TEXT;
CREATE INDEX IF NOT EXISTS "finished_products_sku_reference_id_idx" ON "finished_products"("sku_reference_id");

ALTER TABLE "finished_products" 
  ADD CONSTRAINT "finished_products_sku_reference_id_fkey" 
  FOREIGN KEY ("sku_reference_id") 
  REFERENCES "sku_mappings"("id") 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
