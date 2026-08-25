-- CreateEnum
CREATE TYPE "ModStatus" AS ENUM ('PENDING_SCAN', 'SCANNIND', 'SCAN_FAILED', 'SCAN_CLEAN', 'PENDING_REVIEW', 'ARRPOVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('TH', 'EN');

-- CreateTable
CREATE TABLE "AdminActionLog" (
    "id" TEXT NOT NULL,
    "adminID" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationItem" (
    "id" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "status" "ModStatus" NOT NULL DEFAULT 'PENDING_SCAN',
    "scanResult" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModerationItem_pkey" PRIMARY KEY ("id")
);
