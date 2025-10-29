/*
  Warnings:

  - The values [INTERMEDIATE] on the enum `CategoryType` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `finished_products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `unit_cost` on the `production_allocations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `total_cost` on the `production_allocations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `DoublePrecision`.
  - You are about to alter the column `quantity_consumed` on the `production_allocations` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,3)` to `DoublePrecision`.
  - You are about to drop the column `intermediateProductId` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the `intermediate_products` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `storage_locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Made the column `status` on table `production_allocations` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'FULFILLED');

-- AlterEnum
BEGIN;
CREATE TYPE "CategoryType_new" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT', 'RECIPE');
ALTER TABLE "categories" ALTER COLUMN "type" TYPE "CategoryType_new" USING ("type"::text::"CategoryType_new");
ALTER TYPE "CategoryType" RENAME TO "CategoryType_old";
ALTER TYPE "CategoryType_new" RENAME TO "CategoryType";
DROP TYPE "CategoryType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "finished_products" DROP CONSTRAINT "finished_products_production_run_id_fkey";

-- DropForeignKey
ALTER TABLE "intermediate_products" DROP CONSTRAINT "intermediate_products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "intermediate_products" DROP CONSTRAINT "intermediate_products_qualityStatusId_fkey";

-- DropForeignKey
ALTER TABLE "intermediate_products" DROP CONSTRAINT "intermediate_products_recipeId_fkey";

-- DropForeignKey
ALTER TABLE "intermediate_products" DROP CONSTRAINT "intermediate_products_storageLocationId_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_intermediateProductId_fkey";

-- DropIndex
DROP INDEX "finished_products_production_run_id_idx";

-- DropIndex
DROP INDEX "production_allocations_material_id_idx";

-- DropIndex
DROP INDEX "production_allocations_production_run_id_idx";

-- DropIndex
DROP INDEX "raw_materials_name_idx";

-- AlterTable
ALTER TABLE "finished_products" DROP COLUMN "status",
ADD COLUMN     "status" "ProductionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
ALTER COLUMN "production_run_id" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "production_allocations" ADD COLUMN     "quantity_released" DOUBLE PRECISION,
ALTER COLUMN "material_sku" SET DATA TYPE TEXT,
ALTER COLUMN "material_batch_number" SET DATA TYPE TEXT,
ALTER COLUMN "unit_cost" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "total_cost" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "quantity_consumed" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "production_steps" ADD COLUMN     "alertsGenerated" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "efficiencyScore" DOUBLE PRECISION,
ADD COLUMN     "qualityCheckData" JSONB,
ADD COLUMN     "resourcesConsumed" JSONB,
ADD COLUMN     "stepPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "yieldQuantity" DOUBLE PRECISION,
ADD COLUMN     "yieldUnit" TEXT;

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "intermediateProductId",
ADD COLUMN     "finishedProductId" TEXT;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "overhead_percentage" DOUBLE PRECISION DEFAULT 20;

-- DropTable
DROP TABLE "intermediate_products";

-- DropEnum
DROP TYPE "IntermediateProductStatus";

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "expected_delivery_date" TIMESTAMP(3) NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "total_production_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "price_markup_percentage" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "tva_rate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_production_cost" DOUBLE PRECISION NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "line_production_cost" DOUBLE PRECISION NOT NULL,
    "line_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_orders_orderNumber_key" ON "customer_orders"("orderNumber");

-- CreateIndex
CREATE INDEX "customer_orders_customer_id_idx" ON "customer_orders"("customer_id");

-- CreateIndex
CREATE INDEX "customer_orders_status_idx" ON "customer_orders"("status");

-- CreateIndex
CREATE INDEX "customer_orders_expected_delivery_date_idx" ON "customer_orders"("expected_delivery_date");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_name_key" ON "storage_locations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_name_key" ON "suppliers"("name");

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_production_run_id_fkey" FOREIGN KEY ("production_run_id") REFERENCES "production_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_finishedProductId_fkey" FOREIGN KEY ("finishedProductId") REFERENCES "finished_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "customer_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
