-- AlterTable
ALTER TABLE "raw_materials" ALTER COLUMN "reorderLevel" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "sku_mappings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sku_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sku_mappings_name_key" ON "sku_mappings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sku_mappings_sku_key" ON "sku_mappings"("sku");

-- CreateIndex
CREATE INDEX "sku_mappings_name_idx" ON "sku_mappings"("name");

-- CreateIndex
CREATE INDEX "sku_mappings_sku_idx" ON "sku_mappings"("sku");

-- CreateIndex
CREATE INDEX "raw_materials_name_idx" ON "raw_materials"("name");

-- CreateIndex
CREATE INDEX "raw_materials_sku_idx" ON "raw_materials"("sku");

-- CreateIndex
CREATE INDEX "raw_materials_batchNumber_idx" ON "raw_materials"("batchNumber");

-- CreateIndex
CREATE INDEX "raw_materials_supplierId_idx" ON "raw_materials"("supplierId");

-- CreateIndex
CREATE INDEX "raw_materials_expirationDate_idx" ON "raw_materials"("expirationDate");
