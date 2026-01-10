/*
  Warnings:

  - The values [BASIC] on the enum `SubscriptionPlan` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANCELLED,EXPIRED] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `sku_mappings` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionPlan_new" AS ENUM ('TRIAL', 'FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE');
ALTER TABLE "clients" ALTER COLUMN "subscriptionPlan" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "subscriptionPlan" TYPE "SubscriptionPlan_new" USING ("subscriptionPlan"::text::"SubscriptionPlan_new");
ALTER TYPE "SubscriptionPlan" RENAME TO "SubscriptionPlan_old";
ALTER TYPE "SubscriptionPlan_new" RENAME TO "SubscriptionPlan";
DROP TYPE "SubscriptionPlan_old";
ALTER TABLE "clients" ALTER COLUMN "subscriptionPlan" SET DEFAULT 'TRIAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'SUSPENDED');
ALTER TABLE "clients" ALTER COLUMN "subscriptionStatus" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "subscriptionStatus" TYPE "SubscriptionStatus_new" USING ("subscriptionStatus"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "clients" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'TRIAL';
COMMIT;

-- AlterTable
ALTER TABLE "finished_products" ADD COLUMN     "sku_reference_id" TEXT;

-- AlterTable
ALTER TABLE "raw_materials" ADD COLUMN     "sku_reference_id" TEXT;

-- AlterTable
ALTER TABLE "sku_mappings" DROP COLUMN "category",
ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "reorder_level" DOUBLE PRECISION,
ADD COLUMN     "storage_location_id" TEXT,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "unit_price" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "finished_products_sku_reference_id_idx" ON "finished_products"("sku_reference_id");

-- CreateIndex
CREATE INDEX "raw_materials_sku_reference_id_idx" ON "raw_materials"("sku_reference_id");

-- CreateIndex
CREATE INDEX "sku_mappings_category_id_idx" ON "sku_mappings"("category_id");

-- CreateIndex
CREATE INDEX "sku_mappings_storage_location_id_idx" ON "sku_mappings"("storage_location_id");

-- AddForeignKey
ALTER TABLE "sku_mappings" ADD CONSTRAINT "sku_mappings_storage_location_id_fkey" FOREIGN KEY ("storage_location_id") REFERENCES "storage_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sku_mappings" ADD CONSTRAINT "sku_mappings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_sku_reference_id_fkey" FOREIGN KEY ("sku_reference_id") REFERENCES "sku_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_sku_reference_id_fkey" FOREIGN KEY ("sku_reference_id") REFERENCES "sku_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
