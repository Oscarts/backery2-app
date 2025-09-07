/*
  Warnings:

  - You are about to drop the column `cost_per_unit` on the `intermediate_products` table. All the data in the column will be lost.
  - You are about to drop the column `reserved_quantity` on the `intermediate_products` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "production_allocations_material_id_idx";

-- DropIndex
DROP INDEX "production_allocations_production_run_id_idx";

-- DropIndex
DROP INDEX "production_allocations_status_idx";

-- AlterTable
ALTER TABLE "intermediate_products" DROP COLUMN "cost_per_unit",
DROP COLUMN "reserved_quantity";
