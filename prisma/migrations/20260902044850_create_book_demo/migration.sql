-- CreateEnum
CREATE TYPE "BookDemoStatus" AS ENUM ('PENDING', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "book_demos" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "message" TEXT,
    "status" "BookDemoStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_demos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_demos_email_idx" ON "book_demos"("email");

-- CreateIndex
CREATE INDEX "book_demos_phone_idx" ON "book_demos"("phone");

-- CreateIndex
CREATE INDEX "book_demos_status_idx" ON "book_demos"("status");

-- CreateIndex
CREATE INDEX "book_demos_createdAt_idx" ON "book_demos"("createdAt");
