/*
  Warnings:

  - A unique constraint covering the columns `[clientId,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,name]` on the table `quality_statuses` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,name]` on the table `storage_locations` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,name]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `customer_orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `finished_products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `production_runs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `quality_statuses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `raw_materials` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `recipes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `storage_locations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `users` table without a default value. This is not possible if the table is not empty.

*/

-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "quality_statuses_name_key";

-- DropIndex
DROP INDEX "storage_locations_name_key";

-- DropIndex
DROP INDEX "suppliers_name_key";

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- Insert System Client (for migrating existing data)
INSERT INTO "clients" ("id", "name", "slug", "email", "isActive", "createdAt", "updatedAt")
VALUES ('clsystem000000000000000', 'System', 'system', 'system@bakery.local', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add clientId columns as nullable first, then populate, then make required
-- Users table
ALTER TABLE "users" ADD COLUMN "clientId" TEXT;
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CUSTOM';
UPDATE "users" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "users" ALTER COLUMN "clientId" SET NOT NULL;

-- Categories table
ALTER TABLE "categories" ADD COLUMN "clientId" TEXT;
UPDATE "categories" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "categories" ALTER COLUMN "clientId" SET NOT NULL;

-- Customer orders table
ALTER TABLE "customer_orders" ADD COLUMN "clientId" TEXT;
UPDATE "customer_orders" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "customer_orders" ALTER COLUMN "clientId" SET NOT NULL;

-- Customers table
ALTER TABLE "customers" ADD COLUMN "clientId" TEXT;
UPDATE "customers" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "customers" ALTER COLUMN "clientId" SET NOT NULL;

-- Finished products table
ALTER TABLE "finished_products" ADD COLUMN "clientId" TEXT;
UPDATE "finished_products" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "finished_products" ALTER COLUMN "clientId" SET NOT NULL;

-- Production runs table
ALTER TABLE "production_runs" ADD COLUMN "clientId" TEXT;
UPDATE "production_runs" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "production_runs" ALTER COLUMN "clientId" SET NOT NULL;

-- Quality statuses table
ALTER TABLE "quality_statuses" ADD COLUMN "clientId" TEXT;
UPDATE "quality_statuses" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "quality_statuses" ALTER COLUMN "clientId" SET NOT NULL;

-- Raw materials table
ALTER TABLE "raw_materials" ADD COLUMN "clientId" TEXT;
UPDATE "raw_materials" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "raw_materials" ALTER COLUMN "clientId" SET NOT NULL;

-- Recipes table
ALTER TABLE "recipes" ADD COLUMN "clientId" TEXT;
UPDATE "recipes" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "recipes" ALTER COLUMN "clientId" SET NOT NULL;

-- Storage locations table
ALTER TABLE "storage_locations" ADD COLUMN "clientId" TEXT;
UPDATE "storage_locations" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "storage_locations" ALTER COLUMN "clientId" SET NOT NULL;

-- Suppliers table
ALTER TABLE "suppliers" ADD COLUMN "clientId" TEXT;
UPDATE "suppliers" SET "clientId" = 'clsystem000000000000000' WHERE "clientId" IS NULL;
ALTER TABLE "suppliers" ALTER COLUMN "clientId" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "clients_slug_key" ON "clients"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "roles_clientId_name_key" ON "roles"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_resource_action_key" ON "permissions"("resource", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON "role_permissions"("roleId", "permissionId");

-- CreateIndex
CREATE INDEX "categories_clientId_idx" ON "categories"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "categories_clientId_name_key" ON "categories"("clientId", "name");

-- CreateIndex
CREATE INDEX "customer_orders_clientId_idx" ON "customer_orders"("clientId");

-- CreateIndex
CREATE INDEX "customers_clientId_idx" ON "customers"("clientId");

-- CreateIndex
CREATE INDEX "finished_products_clientId_idx" ON "finished_products"("clientId");

-- CreateIndex
CREATE INDEX "production_runs_clientId_idx" ON "production_runs"("clientId");

-- CreateIndex
CREATE INDEX "quality_statuses_clientId_idx" ON "quality_statuses"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "quality_statuses_clientId_name_key" ON "quality_statuses"("clientId", "name");

-- CreateIndex
CREATE INDEX "raw_materials_clientId_idx" ON "raw_materials"("clientId");

-- CreateIndex
CREATE INDEX "recipes_clientId_idx" ON "recipes"("clientId");

-- CreateIndex
CREATE INDEX "storage_locations_clientId_idx" ON "storage_locations"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "storage_locations_clientId_name_key" ON "storage_locations"("clientId", "name");

-- CreateIndex
CREATE INDEX "suppliers_clientId_idx" ON "suppliers"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_clientId_name_key" ON "suppliers"("clientId", "name");

-- CreateIndex
CREATE INDEX "users_clientId_idx" ON "users"("clientId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storage_locations" ADD CONSTRAINT "storage_locations_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_statuses" ADD CONSTRAINT "quality_statuses_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "raw_materials" ADD CONSTRAINT "raw_materials_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "finished_products" ADD CONSTRAINT "finished_products_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_orders" ADD CONSTRAINT "customer_orders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
