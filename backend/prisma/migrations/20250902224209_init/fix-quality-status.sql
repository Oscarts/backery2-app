DO $$ 
DECLARE
    col_exists boolean;
BEGIN
    -- First drop any existing foreign key constraints that might conflict
    BEGIN
        ALTER TABLE "raw_materials" DROP CONSTRAINT IF EXISTS "raw_materials_qualityStatusId_fkey";
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "intermediate_products" DROP CONSTRAINT IF EXISTS "intermediate_products_qualityStatusId_fkey";
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;
    
    BEGIN
        ALTER TABLE "finished_products" DROP CONSTRAINT IF EXISTS "finished_products_qualityStatusId_fkey";
    EXCEPTION WHEN undefined_column THEN
        NULL;
    END;

    -- Add qualityStatusId column if it doesn't exist
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
        WHERE table_name = 'intermediate_products' 
        AND column_name = 'qualityStatusId'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE "intermediate_products" ADD COLUMN "qualityStatusId" TEXT;
    END IF;
    
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'finished_products' 
        AND column_name = 'qualityStatusId'
    ) INTO col_exists;
    
    IF NOT col_exists THEN
        ALTER TABLE "finished_products" ADD COLUMN "qualityStatusId" TEXT;
    END IF;

    -- Now add the foreign key constraints
    ALTER TABLE "raw_materials" 
    ADD CONSTRAINT "raw_materials_qualityStatusId_fkey" 
    FOREIGN KEY ("qualityStatusId") 
    REFERENCES "quality_statuses"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "intermediate_products" 
    ADD CONSTRAINT "intermediate_products_qualityStatusId_fkey" 
    FOREIGN KEY ("qualityStatusId") 
    REFERENCES "quality_statuses"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

    ALTER TABLE "finished_products" 
    ADD CONSTRAINT "finished_products_qualityStatusId_fkey" 
    FOREIGN KEY ("qualityStatusId") 
    REFERENCES "quality_statuses"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
END $$;
