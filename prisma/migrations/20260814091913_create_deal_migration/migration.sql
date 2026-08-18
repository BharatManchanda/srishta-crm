-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('EXISTING_BUSINESS', 'NEW_BUSINESS');

-- CreateEnum
CREATE TYPE "DealLeadSource" AS ENUM ('ADVERTISEMENT', 'COLD_CALL', 'EMPLOYEE_REFERRAL', 'EXTERNAL_REFERRAL', 'ONLINE_STORE', 'PARTNER', 'PUBLIC_RELATIONS', 'SALES_EMAIL_ALIAS', 'SEMINAR_PARTNER', 'INTERNAL_SEMINAR', 'TRADE_SHOW', 'WEB_DOWNLOAD', 'WEB_RESEARCH', 'CHAT');

-- CreateEnum
CREATE TYPE "DealStage" AS ENUM ('QUALIFICATION', 'NEEDS_ANALYSIS', 'VALUE_PROPOSITION', 'IDENTIFY_DECISION_MAKERS', 'PROPOSAL_PRICE_QUOTE', 'NEGOTIATION_REVIEW', 'CLOSED_WON', 'CLOSED_LOST', 'CLOSED_LOST_TO_COMPETITION');

-- CreateTable
CREATE TABLE "Deal" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "amount" DECIMAL(15,2),
    "leadSource" "DealLeadSource",
    "stage" "DealStage",
    "probability" INTEGER,
    "closingDate" TIMESTAMP(3),
    "socialLeadId" TEXT,
    "description" TEXT,
    "ownerId" INTEGER,
    "accountId" INTEGER,
    "contactId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "type" "DealType" DEFAULT 'EXISTING_BUSINESS',
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deal_ownerId_idx" ON "Deal"("ownerId");

-- CreateIndex
CREATE INDEX "Deal_accountId_idx" ON "Deal"("accountId");

-- CreateIndex
CREATE INDEX "Deal_contactId_idx" ON "Deal"("contactId");

-- CreateIndex
CREATE INDEX "Deal_closingDate_idx" ON "Deal"("closingDate");

-- CreateIndex
CREATE INDEX "Deal_createdById_idx" ON "Deal"("createdById");

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
