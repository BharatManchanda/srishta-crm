/*
  Warnings:

  - The `createdEntityId` column on the `ImportRow` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ImportRow" DROP COLUMN "createdEntityId",
ADD COLUMN     "createdEntityId" INTEGER;
