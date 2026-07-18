-- CreateEnum
CREATE TYPE "GoogleSyncStatus" AS ENUM ('PENDING', 'SYNCING', 'SYNCED', 'FAILED');

-- AlterTable
ALTER TABLE "Call" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "googleSyncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "googleSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "googleSyncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "googleSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "googleSyncStatus" "GoogleSyncStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "googleSyncedAt" TIMESTAMP(3);
