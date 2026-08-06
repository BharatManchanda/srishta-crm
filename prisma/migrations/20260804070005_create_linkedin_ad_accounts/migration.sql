-- CreateTable
CREATE TABLE "LinkedinAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "linkedinUserId" TEXT NOT NULL,
    "name" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinkedinAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkedinAdAccount" (
    "id" SERIAL NOT NULL,
    "linkedinAccountId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT,

    CONSTRAINT "LinkedinAdAccount_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LinkedinAccount" ADD CONSTRAINT "LinkedinAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkedinAdAccount" ADD CONSTRAINT "LinkedinAdAccount_linkedinAccountId_fkey" FOREIGN KEY ("linkedinAccountId") REFERENCES "LinkedinAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
