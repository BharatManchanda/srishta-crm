-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('CUSTOMER', 'PROSPECT', 'PARTNER', 'RESELLER', 'INVESTOR', 'COMPETITOR', 'OTHER');

-- CreateEnum
CREATE TYPE "AccountRating" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('PRIVATE', 'PUBLIC', 'SUBSIDIARY', 'GOVERNMENT', 'OTHER');

-- CreateTable
CREATE TABLE "Account" (
    "id" SERIAL NOT NULL,
    "createdById" INTEGER NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountSite" TEXT,
    "parentAccountId" INTEGER,
    "accountNumber" TEXT,
    "accountType" "AccountType",
    "industry" TEXT,
    "annualRevenue" DECIMAL(15,2),
    "rating" "AccountRating",
    "phone" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "tickerSymbol" TEXT,
    "ownership" "OwnershipType",
    "employees" INTEGER,
    "sicCode" TEXT,
    "billingAddressId" INTEGER,
    "shippingAddressId" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_accountNumber_key" ON "Account"("accountNumber");

-- CreateIndex
CREATE INDEX "Account_createdById_idx" ON "Account"("createdById");

-- CreateIndex
CREATE INDEX "Account_parentAccountId_idx" ON "Account"("parentAccountId");

-- CreateIndex
CREATE INDEX "Account_accountName_idx" ON "Account"("accountName");

-- CreateIndex
CREATE INDEX "Account_industry_idx" ON "Account"("industry");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_parentAccountId_fkey" FOREIGN KEY ("parentAccountId") REFERENCES "Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_billingAddressId_fkey" FOREIGN KEY ("billingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_shippingAddressId_fkey" FOREIGN KEY ("shippingAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
