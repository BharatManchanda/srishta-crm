-- Create Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ai_document_chunks" (
    "id" SERIAL NOT NULL,
    "aiDocumentId" INTEGER NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" vector(1536) NOT NULL,
    "tokenCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_document_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_document_chunks_aiDocumentId_idx" ON "ai_document_chunks"("aiDocumentId");

-- CreateIndex
CREATE INDEX "ai_document_chunks_chunkIndex_idx" ON "ai_document_chunks"("chunkIndex");

-- AddForeignKey
ALTER TABLE "ai_document_chunks" ADD CONSTRAINT "ai_document_chunks_aiDocumentId_fkey" FOREIGN KEY ("aiDocumentId") REFERENCES "ai_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
