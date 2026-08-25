/*
  Warnings:

  - Made the column `razorpayOrderId` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "razorpayOrderId" SET NOT NULL;
