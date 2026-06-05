/*
  Warnings:

  - You are about to drop the column `status` on the `OtpVerification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OtpVerification" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'INACTIVE';
