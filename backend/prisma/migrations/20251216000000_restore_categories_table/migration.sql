-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CategoryType') THEN
        CREATE TYPE "CategoryType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT', 'RECIPE');
    END IF;
END$$;

-- CreateTable
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        CREATE TABLE "categories" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "type" "CategoryType" NOT NULL,
            "description" TEXT,
            "clientId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
        );
    END IF;
END$$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_clientId_idx') THEN
        CREATE INDEX "categories_clientId_idx" ON "categories"("clientId");
    END IF;
END$$;

-- CreateIndex
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'categories_clientId_name_key') THEN
        CREATE UNIQUE INDEX "categories_clientId_name_key" ON "categories"("clientId", "name");
    END IF;
END$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_clientId_fkey') THEN
        ALTER TABLE "categories" ADD CONSTRAINT "categories_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END$$;
