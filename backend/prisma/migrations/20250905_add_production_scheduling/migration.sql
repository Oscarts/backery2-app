-- Migration: Add Production Scheduling Models
-- Description: This migration adds the tables needed for production scheduling and workflow management

-- Create ProductionStatus enum
CREATE TYPE "ProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- Create StepStatus enum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- Create ResourceType enum
CREATE TYPE "ResourceType" AS ENUM ('RAW_MATERIAL', 'INTERMEDIATE_PRODUCT', 'EQUIPMENT', 'PERSONNEL');

-- Create ProductionSchedules table
CREATE TABLE "ProductionSchedule" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "ProductionStatus" NOT NULL DEFAULT 'PLANNED',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "recipeId" TEXT NOT NULL,
  "outputQuantity" DOUBLE PRECISION NOT NULL,
  "outputUnit" TEXT NOT NULL,
  "notes" TEXT,
  "assignedTo" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductionSchedule_pkey" PRIMARY KEY ("id")
);

-- Create ProductionSteps table
CREATE TABLE "ProductionStep" (
  "id" TEXT NOT NULL,
  "productionScheduleId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "durationMinutes" INTEGER,
  "actualDurationMinutes" INTEGER,
  "ordinalPosition" INTEGER NOT NULL,
  "notes" TEXT,
  "ingredientsMapped" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductionStep_pkey" PRIMARY KEY ("id")
);

-- Create ResourceAllocations table
CREATE TABLE "ResourceAllocation" (
  "id" TEXT NOT NULL,
  "productionScheduleId" TEXT NOT NULL,
  "resourceType" "ResourceType" NOT NULL,
  "resourceId" TEXT NOT NULL,
  "quantityRequired" DOUBLE PRECISION,
  "unit" TEXT,
  "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ResourceAllocation_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "ProductionSchedule" ADD CONSTRAINT "ProductionSchedule_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductionStep" ADD CONSTRAINT "ProductionStep_productionScheduleId_fkey" FOREIGN KEY ("productionScheduleId") REFERENCES "ProductionSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ResourceAllocation" ADD CONSTRAINT "ResourceAllocation_productionScheduleId_fkey" FOREIGN KEY ("productionScheduleId") REFERENCES "ProductionSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for performance
CREATE INDEX "ProductionSchedule_recipeId_idx" ON "ProductionSchedule"("recipeId");
CREATE INDEX "ProductionSchedule_status_idx" ON "ProductionSchedule"("status");
CREATE INDEX "ProductionSchedule_startDate_idx" ON "ProductionSchedule"("startDate");
CREATE INDEX "ProductionStep_productionScheduleId_idx" ON "ProductionStep"("productionScheduleId");
CREATE INDEX "ResourceAllocation_productionScheduleId_idx" ON "ResourceAllocation"("productionScheduleId");
CREATE INDEX "ResourceAllocation_resourceType_resourceId_idx" ON "ResourceAllocation"("resourceType", "resourceId");
