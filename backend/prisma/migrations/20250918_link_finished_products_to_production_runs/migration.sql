-- Link finished products to their production runs for traceability
ALTER TABLE "finished_products" ADD COLUMN "production_run_id" VARCHAR;

-- Add foreign key constraint
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_production_run_id_fkey" 
FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX "finished_products_production_run_id_idx" ON "finished_products"("production_run_id");

COMMENT ON COLUMN "finished_products"."production_run_id" IS 'Reference to the production run that created this finished product';