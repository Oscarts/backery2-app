-- CreateEnum
CREATE TYPE "SkuItemType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT');

-- AlterTable
ALTER TABLE "sku_mappings" ADD COLUMN     "itemType" "SkuItemType" NOT NULL DEFAULT 'RAW_MATERIAL';
