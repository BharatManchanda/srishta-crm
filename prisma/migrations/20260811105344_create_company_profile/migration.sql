/*
  Warnings:

  - You are about to drop the column `comapanyEmail` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `comapanyPhone` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "comapanyEmail",
DROP COLUMN "comapanyPhone",
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "companyPhone" TEXT;
