-- CreateEnum
CREATE TYPE "LeadSyncModule" AS ENUM ('LEAD', 'CONTACT');

-- CreateEnum
CREATE TYPE "LeadSyncStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "LeadSyncChain" (
    "id" SERIAL NOT NULL,
    "createdById" INTEGER NOT NULL,
    "facebookAccountId" INTEGER NOT NULL,
    "facebookAdAccountId" TEXT NOT NULL,
    "facebookPageId" TEXT NOT NULL,
    "facebookFormId" TEXT NOT NULL,
    "module" "LeadSyncModule" NOT NULL,
    "status" "LeadSyncStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadSyncChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadSyncMapping" (
    "id" SERIAL NOT NULL,
    "chainId" INTEGER NOT NULL,
    "crmField" TEXT NOT NULL,
    "facebookField" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadSyncMapping_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LeadSyncChain" ADD CONSTRAINT "LeadSyncChain_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSyncChain" ADD CONSTRAINT "LeadSyncChain_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "FacebookAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadSyncMapping" ADD CONSTRAINT "LeadSyncMapping_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "LeadSyncChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;
