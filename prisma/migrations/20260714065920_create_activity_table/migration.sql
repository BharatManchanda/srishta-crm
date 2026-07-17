/*
  Warnings:

  - You are about to drop the column `processedRows` on the `ImportJob` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityEntity" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT', 'TASK', 'CALL', 'MEETING', 'NOTE', 'DEAL');

-- AlterTable
ALTER TABLE "ImportJob" DROP COLUMN "processedRows";

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "entityType" "ActivityEntity" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Activity_entityType_entityId_idx" ON "Activity"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
