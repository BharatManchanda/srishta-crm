-- CreateEnum
CREATE TYPE "AiEntityType" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT', 'TASK', 'CALL', 'MEETING');

-- CreateTable
CREATE TABLE "ai_documents" (
    "id" SERIAL NOT NULL,
    "entityType" "AiEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_documents_entityType_entityId_idx" ON "ai_documents"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "ai_documents" ADD CONSTRAINT "ai_documents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
