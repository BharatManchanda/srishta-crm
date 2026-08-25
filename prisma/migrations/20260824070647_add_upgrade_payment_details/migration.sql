-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "durationDays" DECIMAL(10,4),
ADD COLUMN     "isUpgrade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "upgradeCredit" DECIMAL(10,2);
