/*
  Warnings:

  - You are about to drop the column `accessTokens` on the `Role` table. All the data in the column will be lost.
  - You are about to drop the column `refreshTokens` on the `Role` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "accessTokens",
DROP COLUMN "refreshTokens";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "refreshTokens" TEXT[] DEFAULT ARRAY[]::TEXT[];
