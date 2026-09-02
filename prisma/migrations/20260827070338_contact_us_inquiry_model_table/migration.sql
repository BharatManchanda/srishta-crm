-- CreateEnum
CREATE TYPE "ContactInquiryType" AS ENUM ('PRODUCT_INFORMATION', 'DEMO', 'SUPPORT', 'PARTNERSHIP', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactInquiryStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'RESOLVED', 'CLOSED', 'SPAM');

-- CreateEnum
CREATE TYPE "ContactInquiryPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- AlterEnum
ALTER TYPE "NoteEntityType" ADD VALUE 'CONTACT_INQUIRY';

-- CreateTable
CREATE TABLE "ContactInquiry" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "website" TEXT,
    "inquiryType" "ContactInquiryType" NOT NULL,
    "message" TEXT,
    "status" "ContactInquiryStatus" NOT NULL DEFAULT 'NEW',
    "priority" "ContactInquiryPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT DEFAULT 'website',
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactInquiry_email_idx" ON "ContactInquiry"("email");

-- CreateIndex
CREATE INDEX "ContactInquiry_status_idx" ON "ContactInquiry"("status");

-- CreateIndex
CREATE INDEX "ContactInquiry_inquiryType_idx" ON "ContactInquiry"("inquiryType");

-- CreateIndex
CREATE INDEX "ContactInquiry_priority_idx" ON "ContactInquiry"("priority");

-- CreateIndex
CREATE INDEX "ContactInquiry_createdAt_idx" ON "ContactInquiry"("createdAt");

-- CreateIndex
CREATE INDEX "ContactInquiry_source_idx" ON "ContactInquiry"("source");
