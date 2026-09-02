/*
  Warnings:

  - You are about to drop the column `excerpt` on the `BlogPost` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlogPost" DROP COLUMN "excerpt",
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false;
