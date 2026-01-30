/*
  Warnings:

  - You are about to drop the column `createdAt` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `finishedProductId` on the `recipe_ingredients` table. All the data in the column will be lost.
  - You are about to drop the column `rawMaterialId` on the `recipe_ingredients` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_finishedProductId_fkey";

-- DropForeignKey
ALTER TABLE "recipe_ingredients" DROP CONSTRAINT "recipe_ingredients_rawMaterialId_fkey";

-- AlterTable
ALTER TABLE "recipe_ingredients" DROP COLUMN "createdAt",
DROP COLUMN "finishedProductId",
DROP COLUMN "rawMaterialId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "finished_product_id" TEXT,
ADD COLUMN     "raw_material_id" TEXT,
ADD COLUMN     "sku_mapping_id" TEXT;

-- CreateIndex
CREATE INDEX "recipe_ingredients_sku_mapping_id_idx" ON "recipe_ingredients"("sku_mapping_id");

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_sku_mapping_id_fkey" FOREIGN KEY ("sku_mapping_id") REFERENCES "sku_mappings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_raw_material_id_fkey" FOREIGN KEY ("raw_material_id") REFERENCES "raw_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_finished_product_id_fkey" FOREIGN KEY ("finished_product_id") REFERENCES "finished_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
