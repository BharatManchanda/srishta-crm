-- DropIndex
DROP INDEX "Payment_razorpayOrderId_key";

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "razorpayOrderId" DROP NOT NULL;
