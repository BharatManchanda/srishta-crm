-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('ADMINISTRATIVE', 'STANDARD');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessLevel" "AccessLevel" NOT NULL DEFAULT 'ADMINISTRATIVE';
