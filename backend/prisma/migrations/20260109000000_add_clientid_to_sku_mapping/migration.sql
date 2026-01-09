-- Migration: Add clientId to SkuMapping table for multi-tenant isolation
-- This migration adds the clientId field and updates existing records

-- Step 1: Add clientId column as nullable first
ALTER TABLE "sku_mappings" ADD COLUMN "clientId" TEXT;

-- Step 2: Set clientId for existing records
-- Assign all existing SKU mappings to the Demo Bakery client
-- If there are no SKU mappings or we need a different strategy, this can be adjusted
UPDATE "sku_mappings" 
SET "clientId" = (
  SELECT "id" FROM "clients" 
  WHERE "slug" = 'demo-bakery' 
  LIMIT 1
)
WHERE "clientId" IS NULL;

-- Step 3: Make clientId NOT NULL
ALTER TABLE "sku_mappings" ALTER COLUMN "clientId" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "sku_mappings" 
ADD CONSTRAINT "sku_mappings_clientId_fkey" 
FOREIGN KEY ("clientId") 
REFERENCES "clients"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Step 5: Drop old unique constraints
DROP INDEX IF EXISTS "sku_mappings_name_key";
DROP INDEX IF EXISTS "sku_mappings_sku_key";

-- Step 6: Add new composite unique constraints (name+clientId, sku+clientId)
CREATE UNIQUE INDEX "sku_mappings_name_clientId_key" ON "sku_mappings"("name", "clientId");
CREATE UNIQUE INDEX "sku_mappings_sku_clientId_key" ON "sku_mappings"("sku", "clientId");

-- Step 7: Add index for clientId
CREATE INDEX "sku_mappings_clientId_idx" ON "sku_mappings"("clientId");
