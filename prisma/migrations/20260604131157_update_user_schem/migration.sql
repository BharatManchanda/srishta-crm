-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'INVITED');

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "accessTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "refreshTokens" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT;
