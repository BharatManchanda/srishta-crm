/*
  Warnings:

  - Added the required column `customerId` to the `GoogleAdsConnection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GoogleAdsConnection" ADD COLUMN     "customerId" TEXT NOT NULL;
