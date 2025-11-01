-- CreateTable (if not exists)
DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- CreateIndex (if not exists)
DO $$ BEGIN
    DROP INDEX IF EXISTS "quality_statuses_name_key";
    CREATE UNIQUE INDEX "quality_statuses_name_key" ON "quality_statuses"("name");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Insert default quality statuses (if not exist)
INSERT INTO "quality_statuses" ("id", "name", "description", "color", "sortOrder", "createdAt", "updatedAt")
SELECT i.* FROM (VALUES
    ('clz001', 'Good', 'Product meets all quality standards', '#4caf50', 1, NOW(), NOW()),
    ('clz002', 'Damaged', 'Product has minor damage but may still be usable', '#ff9800', 2, NOW(), NOW()),
    ('clz003', 'Defective', 'Product has defects that affect quality', '#f44336', 3, NOW(), NOW()),
    ('clz004', 'Rejected', 'Product rejected and should not be used', '#9c27b0', 4, NOW(), NOW()),
    ('clz005', 'Pending Review', 'Product pending quality inspection', '#2196f3', 0, NOW(), NOW())
) AS i(id, name, description, color, sortOrder, createdAt, updatedAt)
WHERE NOT EXISTS (
    SELECT 1 FROM "quality_statuses" WHERE id = i.id
);

-- Add qualityStatusId columns to existing tables if they don't exist
DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    -- Add columns if they don't exist
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'raw_materials' 
        AND column_name = 'qualityStatusId'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE "raw_materials" ADD COLUMN "qualityStatusId" TEXT;
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'finished_products' 
        AND column_name = 'qualityStatusId'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE "finished_products" ADD COLUMN "qualityStatusId" TEXT;
    END IF;

    -- Add foreign key constraints if they don't exist
    BEGIN
        ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_qualityStatusId_fkey" 
        FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_qualityStatusId_fkey" 
        FOREIGN KEY ("qualityStatusId") REFERENCES "quality_statuses"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
