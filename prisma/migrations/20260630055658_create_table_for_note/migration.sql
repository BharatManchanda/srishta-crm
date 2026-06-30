-- CreateEnum
CREATE TYPE "NoteEntityType" AS ENUM ('LEAD', 'CONTACT', 'ACCOUNT', 'DEAL', 'TASK', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "entityType" "NoteEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Note_entityType_entityId_idx" ON "Note"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Note_createdById_idx" ON "Note"("createdById");

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
