-- CreateTable
CREATE TABLE "quality_statuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_statuses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quality_statuses_name_key" ON "quality_statuses"("name");

-- Insert default quality statuses
INSERT INTO "quality_statuses" ("id", "name", "description", "color", "sortOrder", "createdAt", "updatedAt") VALUES
('clz001', 'Good', 'Product meets all quality standards', '#4caf50', 1, NOW(), NOW()),
('clz002', 'Damaged', 'Product has minor damage but may still be usable', '#ff9800', 2, NOW(), NOW()),
('clz003', 'Defective', 'Product has defects that affect quality', '#f44336', 3, NOW(), NOW()),
('clz004', 'Rejected', 'Product rejected and should not be used', '#9c27b0', 4, NOW(), NOW()),
('clz005', 'Pending Review', 'Product pending quality inspection', '#2196f3', 0, NOW(), NOW());

-- Add qualityStatusId columns to existing tables
ALTER TABLE "raw_materials" ADD COLUMN "qualityStatusId" TEXT;
ALTER TABLE "finished_products" ADD COLUMN "qualityStatusId" TEXT;
ALTER TABLE "intermediate_products" ADD COLUMN "qualityStatusId" TEXT;

-- Note: Skipping migration of legacy qualityStatus string column as it does not exist in current schema

-- Add foreign key constraints
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_qualityStatusId_fkey" FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "intermediate_products" ADD CONSTRAINT "intermediate_products_qualityStatusId_fkey" FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_qualityStatusId_fkey" FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
