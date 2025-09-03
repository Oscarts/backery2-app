/*
  Warnings:

  - You are about to drop the column `isDefault` on the `quality_statuses` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "recipes" DROP CONSTRAINT "recipes_categoryId_fkey";

-- AlterTable
ALTER TABLE "quality_statuses" DROP COLUMN "isDefault";

-- AlterTable
ALTER TABLE "recipes" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
