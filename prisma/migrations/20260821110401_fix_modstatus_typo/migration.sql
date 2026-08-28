/*
  Warnings:

  - The values [SCANNIND] on the enum `ModStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModStatus_new" AS ENUM ('PENDING_SCAN', 'SCANNING', 'SCAN_FAILED', 'SCAN_CLEAN', 'PENDING_REVIEW', 'ARRPOVED', 'REJECTED');
ALTER TABLE "public"."ModerationItem" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ModerationItem" ALTER COLUMN "status" TYPE "ModStatus_new" USING ("status"::text::"ModStatus_new");
ALTER TYPE "ModStatus" RENAME TO "ModStatus_old";
ALTER TYPE "ModStatus_new" RENAME TO "ModStatus";
DROP TYPE "public"."ModStatus_old";
ALTER TABLE "ModerationItem" ALTER COLUMN "status" SET DEFAULT 'PENDING_SCAN';
COMMIT;
