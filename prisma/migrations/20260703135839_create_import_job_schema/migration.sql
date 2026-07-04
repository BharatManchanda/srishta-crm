/*
  Warnings:

  - You are about to drop the column `originalName` on the `ImportJob` table. All the data in the column will be lost.
  - Added the required column `url` to the `ImportJob` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ImportJob" DROP COLUMN "originalName",
ADD COLUMN     "url" TEXT NOT NULL;
