-- CreateEnum
CREATE TYPE "LeadSyncChainProvider" AS ENUM ('FACEBOOK_ADS', 'GOOGLE_ADS');

-- DropForeignKey
ALTER TABLE "LeadSyncChain" DROP CONSTRAINT "LeadSyncChain_facebookAccountId_fkey";

-- AlterTable
ALTER TABLE "LeadSyncChain" ADD COLUMN     "googleAdsId" INTEGER,
ADD COLUMN     "provider" "LeadSyncChainProvider" NOT NULL DEFAULT 'FACEBOOK_ADS',
ALTER COLUMN "facebookAccountId" DROP NOT NULL,
ALTER COLUMN "facebookAdAccountId" DROP NOT NULL,
ALTER COLUMN "facebookPageId" DROP NOT NULL,
ALTER COLUMN "facebookFormId" DROP NOT NULL,
ALTER COLUMN "module" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "LeadSyncChain" ADD CONSTRAINT "LeadSyncChain_facebookAccountId_fkey" FOREIGN KEY ("facebookAccountId") REFERENCES "FacebookAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
