-- CreateEnum
CREATE TYPE "CallEntityType" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT', 'DEAL', 'TASK', 'OPPORTUNITY');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CallResult" AS ENUM ('INTERESTED', 'NOT_INTERESTED', 'NO_RESPONSE_BUSY', 'REQUESTED_MORE_INFO', 'REQUESTED_CALL_BACK', 'INVALID_NUMBER');

-- CreateEnum
CREATE TYPE "CallPurpose" AS ENUM ('PROSPECTING', 'ADMINISTRATIVE', 'NEGOTIATION', 'DEMO', 'PROJECT', 'DESK');

-- CreateTable
CREATE TABLE "Call" (
    "id" SERIAL NOT NULL,
    "entityType" "CallEntityType",
    "entityId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "purpose" "CallPurpose",
    "agenda" TEXT,
    "description" TEXT,
    "result" "CallResult",
    "callStartTime" TIMESTAMP(3),
    "callDuration" INTEGER NOT NULL DEFAULT 0,
    "status" "CallStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
