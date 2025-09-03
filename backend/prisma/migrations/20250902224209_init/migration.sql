-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'STAFF', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "IntermediateProductStatus" AS ENUM ('IN_PRODUCTION', 'COMPLETED', 'ON_HOLD', 'DISCARDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTables
DO $$ 
BEGIN
    -- Create tables if they don't exist
    BEGIN
        CREATE TABLE "users" (
            "id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "passwordHash" TEXT NOT NULL,
            "role" "UserRole" NOT NULL DEFAULT 'STAFF',
            "firstName" TEXT NOT NULL,
            "lastName" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "suppliers" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "contactInfo" JSONB,
            "address" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "storage_locations" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" TEXT,
            "description" TEXT,
            "capacity" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "storage_locations_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
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
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "units" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "symbol" TEXT NOT NULL,
            "category" TEXT NOT NULL,
            "description" TEXT,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "units_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "raw_materials" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "supplierId" TEXT NOT NULL,
            "batchNumber" TEXT NOT NULL,
            "purchaseDate" TIMESTAMP(3),
            "expirationDate" TIMESTAMP(3) NOT NULL,
            "quantity" DOUBLE PRECISION NOT NULL,
            "unit" TEXT NOT NULL,
            "unitPrice" DOUBLE PRECISION NOT NULL,
            "reorderLevel" DOUBLE PRECISION NOT NULL,
            "storageLocationId" TEXT NOT NULL,
            "qualityStatusId" TEXT,
            "isContaminated" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "raw_materials_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "intermediate_products" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "batchNumber" TEXT NOT NULL,
            "productionDate" TIMESTAMP(3) NOT NULL,
            "expirationDate" TIMESTAMP(3) NOT NULL,
            "quantity" DOUBLE PRECISION NOT NULL,
            "unit" TEXT NOT NULL,
            "storageLocationId" TEXT NOT NULL,
            "status" "IntermediateProductStatus" NOT NULL DEFAULT 'IN_PRODUCTION',
            "contaminated" BOOLEAN NOT NULL DEFAULT false,
            "qualityStatusId" TEXT,
            "recipeId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "intermediate_products_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "finished_products" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "sku" TEXT NOT NULL,
            "batchNumber" TEXT NOT NULL,
            "productionDate" TIMESTAMP(3) NOT NULL,
            "expirationDate" TIMESTAMP(3) NOT NULL,
            "shelfLife" INTEGER NOT NULL,
            "quantity" DOUBLE PRECISION NOT NULL,
            "reservedQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "unit" TEXT NOT NULL,
            "salePrice" DOUBLE PRECISION NOT NULL,
            "costToProduce" DOUBLE PRECISION,
            "packagingInfo" TEXT,
            "storageLocationId" TEXT,
            "qualityStatusId" TEXT,
            "status" "IntermediateProductStatus" NOT NULL DEFAULT 'IN_PRODUCTION',
            "isContaminated" BOOLEAN NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "finished_products_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "recipes" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "yieldQuantity" DOUBLE PRECISION NOT NULL,
            "yieldUnit" TEXT NOT NULL,
            "prepTime" INTEGER,
            "cookTime" INTEGER,
            "instructions" JSONB,
            "version" INTEGER NOT NULL DEFAULT 1,
            "isActive" BOOLEAN NOT NULL DEFAULT true,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;

    BEGIN
        CREATE TABLE "recipe_ingredients" (
            "id" TEXT NOT NULL,
            "recipeId" TEXT NOT NULL,
            "rawMaterialId" TEXT,
            "intermediateProductId" TEXT,
            "quantity" DOUBLE PRECISION NOT NULL,
            "unit" TEXT NOT NULL,
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
        );
    EXCEPTION WHEN duplicate_table THEN
        NULL;
    END;
END $$;

-- CreateIndexes
DO $$
BEGIN
    BEGIN
        DROP INDEX IF EXISTS "users_email_key";
        CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        DROP INDEX IF EXISTS "quality_statuses_name_key";
        CREATE UNIQUE INDEX "quality_statuses_name_key" ON "quality_statuses"("name");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        DROP INDEX IF EXISTS "units_name_key";
        CREATE UNIQUE INDEX "units_name_key" ON "units"("name");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        DROP INDEX IF EXISTS "units_symbol_key";
        CREATE UNIQUE INDEX "units_symbol_key" ON "units"("symbol");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        DROP INDEX IF EXISTS "intermediate_products_batchNumber_key";
        CREATE UNIQUE INDEX "intermediate_products_batchNumber_key" ON "intermediate_products"("batchNumber");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        DROP INDEX IF EXISTS "finished_products_sku_key";
        CREATE UNIQUE INDEX "finished_products_sku_key" ON "finished_products"("sku");
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- AddForeignKeys
DO $$
BEGIN
    -- Apply non-quality status foreign keys first
    BEGIN
        ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_storageLocationId_fkey" 
        FOREIGN KEY ("storageLocationId") REFERENCES "storage_locations"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_supplierId_fkey" 
        FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "intermediate_products" ADD CONSTRAINT "intermediate_products_recipeId_fkey" 
        FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "intermediate_products" ADD CONSTRAINT "intermediate_products_storageLocationId_fkey" 
        FOREIGN KEY ("storageLocationId") REFERENCES "storage_locations"("id") 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_storageLocationId_fkey" 
        FOREIGN KEY ("storageLocationId") REFERENCES "storage_locations"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" 
        FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_rawMaterialId_fkey" 
        FOREIGN KEY ("rawMaterialId") REFERENCES "raw_materials"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;

    BEGIN
        ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_intermediateProductId_fkey" 
        FOREIGN KEY ("intermediateProductId") REFERENCES "intermediate_products"("id") 
        ON DELETE SET NULL ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;
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
