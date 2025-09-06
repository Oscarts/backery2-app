-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('IN_PROGRESS', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ProductionStepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "difficulty" "RecipeDifficulty" DEFAULT 'MEDIUM',
ADD COLUMN     "emoji" TEXT,
ADD COLUMN     "equipmentRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estimatedTotalTime" INTEGER;

-- CreateTable
CREATE TABLE "production_runs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "targetQuantity" DOUBLE PRECISION NOT NULL,
    "targetUnit" TEXT NOT NULL,
    "status" "ProductionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStepIndex" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "estimatedFinish" TIMESTAMP(3),
    "actualCost" DOUBLE PRECISION,
    "finalQuantity" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_steps" (
    "id" TEXT NOT NULL,
    "productionRunId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stepOrder" INTEGER NOT NULL,
    "estimatedMinutes" INTEGER,
    "status" "ProductionStepStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "actualMinutes" INTEGER,
    "notes" TEXT,
    "temperature" INTEGER,
    "equipmentUsed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "qualityCheckPassed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "production_runs" ADD CONSTRAINT "production_runs_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_steps" ADD CONSTRAINT "production_steps_productionRunId_fkey" FOREIGN KEY ("productionRunId") REFERENCES "production_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
