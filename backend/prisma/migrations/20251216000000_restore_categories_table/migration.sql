-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('RAW_MATERIAL', 'FINISHED_PRODUCT', 'RECIPE');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "description" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_clientId_idx" ON "categories"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_clientId_name_key" ON "categories"("clientId", "name");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
