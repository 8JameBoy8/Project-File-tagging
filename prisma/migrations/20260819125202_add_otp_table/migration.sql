/*
  Warnings:

  - You are about to drop the column `exptresAt` on the `PasswordResetOtp` table. All the data in the column will be lost.
  - Added the required column `expiresAt` to the `PasswordResetOtp` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PasswordResetOtp" DROP COLUMN "exptresAt",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
