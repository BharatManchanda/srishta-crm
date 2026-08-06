/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `LinkedinAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "LinkedinAccount_userId_key" ON "LinkedinAccount"("userId");
