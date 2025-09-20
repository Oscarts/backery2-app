-- Add material cost tracking and batch information to production allocations
-- This migration adds fields to track cost, batch numbers, SKU, and actual consumption

ALTER TABLE "production_allocations" ADD COLUMN "material_sku" VARCHAR(100);
ALTER TABLE "production_allocations" ADD COLUMN "material_batch_number" VARCHAR(100);
ALTER TABLE "production_allocations" ADD COLUMN "unit_cost" DECIMAL(10,2);
ALTER TABLE "production_allocations" ADD COLUMN "total_cost" DECIMAL(10,2);
ALTER TABLE "production_allocations" ADD COLUMN "quantity_consumed" DECIMAL(10,3);
ALTER TABLE "production_allocations" ADD COLUMN "notes" TEXT;

-- Update the status enum to be more specific
ALTER TABLE "production_allocations" DROP COLUMN "status";
ALTER TABLE "production_allocations" ADD COLUMN "status" VARCHAR(20) DEFAULT 'ALLOCATED';

COMMENT ON COLUMN "production_allocations"."material_sku" IS 'SKU of the material used';
COMMENT ON COLUMN "production_allocations"."material_batch_number" IS 'Batch number of the material used';
COMMENT ON COLUMN "production_allocations"."unit_cost" IS 'Cost per unit of the material at time of allocation';
COMMENT ON COLUMN "production_allocations"."total_cost" IS 'Total cost of materials consumed';
COMMENT ON COLUMN "production_allocations"."quantity_consumed" IS 'Actual quantity consumed during production';
COMMENT ON COLUMN "production_allocations"."notes" IS 'Additional notes about material usage';