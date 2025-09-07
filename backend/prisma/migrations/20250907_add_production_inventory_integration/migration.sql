-- Add ProductionAllocation table and reserved quantity tracking

-- Add ProductionAllocation table
CREATE TABLE "production_allocations" (
    "id" TEXT NOT NULL,
    "production_run_id" TEXT NOT NULL,
    "material_type" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "material_name" TEXT NOT NULL,
    "quantity_allocated" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ALLOCATED',
    "allocated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumed_at" TIMESTAMP(3),
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_allocations_pkey" PRIMARY KEY ("id")
);

-- Add reserved quantity fields to raw materials
ALTER TABLE "raw_materials" ADD COLUMN "reserved_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add reserved quantity fields to intermediate products  
ALTER TABLE "intermediate_products" ADD COLUMN "reserved_quantity" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Add cost per unit to intermediate products
ALTER TABLE "intermediate_products" ADD COLUMN "cost_per_unit" DOUBLE PRECISION;

-- Add foreign key constraint for production allocations
ALTER TABLE "production_allocations" ADD CONSTRAINT "production_allocations_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for performance
CREATE INDEX "production_allocations_production_run_id_idx" ON "production_allocations"("production_run_id");
CREATE INDEX "production_allocations_material_id_idx" ON "production_allocations"("material_id");
CREATE INDEX "production_allocations_status_idx" ON "production_allocations"("status");
