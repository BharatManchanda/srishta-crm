import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiDocumentResult } from './dto/ai-document-result';

@Injectable()
export class VectorService {

    constructor(
        private prisma: PrismaService,
    ) {}

    async similaritySearch(vector: number[]) {
        const vectorString = `[${vector.join(',')}]`;
        return this.prisma.$queryRawUnsafe<AiDocumentResult[]>(`
            SELECT
                c.*,
                d.id AS "documentId",
                d.title,
                d."entityType",
                d."entityId",
                d."content",
                c.embedding <=> '${vectorString}' AS distance
            FROM "ai_document_chunks" c
            JOIN "ai_documents" d
            ON d.id = c."aiDocumentId"
            ORDER BY c.embedding <=> '${vectorString}'
            LIMIT 5;
        `);
    }
}