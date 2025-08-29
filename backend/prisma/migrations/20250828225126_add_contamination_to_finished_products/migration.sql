/*
  Warnings:

  - You are about to drop the column `qualityStatus` on the `intermediate_products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "finished_products" ADD COLUMN     "isContaminated" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "intermediate_products" DROP COLUMN "qualityStatus";

-- DropEnum
DROP TYPE "QualityStatus";
