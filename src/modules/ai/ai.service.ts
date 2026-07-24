import { Injectable, NotFoundException } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorService } from './vector.service';
import { GeminiService } from './gemini.service';
import { PromptService } from './prompt.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiDocumentCreateDto } from './dto/ai-document-create.dto';
import { AiDocumentUpdateDto } from './dto/ai-document-update.dto';

@Injectable()
export class AiService {
    constructor(
        private embedding: EmbeddingService,
        private vector: VectorService,
        private gemini: GeminiService,
        private prompt: PromptService,
        private readonly prisma: PrismaService,
    ) { }

    async ask(question: string) {
        const embedding = await this.embedding.embed(question);
        if (!embedding) {
            throw new Error("Failed to generate embedding");
        }
        const docs = await this.vector.similaritySearch(embedding);
        const prompt = this.prompt.build(question, docs);
        return this.gemini.chat(prompt);
    }

    async create(dto: AiDocumentCreateDto, authUserId: number) {
        const document = await this.prisma.aiDocument.create({
            data: {
                entityType: dto.entityType,
                entityId: dto.entityId,
                title: dto.title,
                content: dto.content,
                createdById: authUserId,
            }
        });
        await this.indexDocument(document.id, document.content);
        return document;
    }

    async update(dto: AiDocumentUpdateDto, authUserId?: number) {
        const document = await this.prisma.aiDocument.findFirst({
            where: {
                entityId: dto.entityId,
                entityType: dto.entityType,
            },
        });

        if (!document) {
            const newDoc = await this.prisma.aiDocument.create({
                data: {
                    entityType: dto.entityType,
                    entityId: dto.entityId,
                    title: dto.title,
                    content: dto.content,
                    createdById: authUserId || 1,
                }
            });
            await this.indexDocument(newDoc.id, newDoc.content);
            return newDoc;
        }

        const updated = await this.prisma.aiDocument.update({
            where: {
                id: document.id,
            },
            data: {
                title: dto.title,
                content: dto.content,
            },
        });
        await this.indexDocument(updated.id, updated.content);
        return updated;
    }

    private chunkText(text: string, maxChunkLength: number = 1000, overlap: number = 200): string[] {
        if (!text) return [];
        const chunks: string[] = [];
        let startIndex = 0;
        while (startIndex < text.length) {
            let endIndex = startIndex + maxChunkLength;
            if (endIndex < text.length) {
                const nextSpace = text.lastIndexOf(' ', endIndex);
                if (nextSpace > startIndex + maxChunkLength / 2) {
                    endIndex = nextSpace;
                }
            }
            const chunk = text.substring(startIndex, endIndex).trim();
            if (chunk) {
                chunks.push(chunk);
            }
            startIndex = endIndex - overlap;
            if (startIndex >= text.length - overlap) {
                break;
            }
        }
        if (chunks.length === 0 && text.trim().length > 0) {
            chunks.push(text.trim());
        }
        return chunks;
    }

    private async indexDocument(documentId: number, content: string) {
        // Delete existing chunks
        await this.prisma.$executeRawUnsafe(
            `DELETE FROM "ai_document_chunks" WHERE "aiDocumentId" = $1`,
            documentId
        );

        const chunks = this.chunkText(content);
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const embedding = await this.embedding.embed(chunk);
            if (!embedding) {
                throw new Error(`Failed to generate embedding for chunk ${i}`);
            }
            const vectorString = `[${embedding.join(',')}]`;
            await this.prisma.$executeRawUnsafe(
                `INSERT INTO "ai_document_chunks" ("aiDocumentId", "chunkIndex", "content", "embedding", "updatedAt") VALUES ($1, $2, $3, CAST($4 AS vector), NOW())`,
                documentId,
                i,
                chunk,
                vectorString
            );
        }
    }
}
