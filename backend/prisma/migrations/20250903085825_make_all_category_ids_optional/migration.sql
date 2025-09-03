-- DropForeignKey
ALTER TABLE "finished_products" DROP CONSTRAINT "finished_products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "intermediate_products" DROP CONSTRAINT "intermediate_products_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "raw_materials" DROP CONSTRAINT "raw_materials_categoryId_fkey";

-- AlterTable
ALTER TABLE "finished_products" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "intermediate_products" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "raw_materials" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "intermediate_products" ADD CONSTRAINT "intermediate_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
