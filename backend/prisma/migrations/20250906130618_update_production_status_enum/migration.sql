/*
  Warnings:

  - The values [PAUSED] on the enum `ProductionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductionStatus_new" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');
ALTER TABLE "production_runs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "production_runs" ALTER COLUMN "status" TYPE "ProductionStatus_new" USING ("status"::text::"ProductionStatus_new");
ALTER TYPE "ProductionStatus" RENAME TO "ProductionStatus_old";
ALTER TYPE "ProductionStatus_new" RENAME TO "ProductionStatus";
DROP TYPE "ProductionStatus_old";
ALTER TABLE "production_runs" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
COMMIT;

-- AlterTable
ALTER TABLE "production_runs" ALTER COLUMN "status" SET DEFAULT 'PLANNED';
