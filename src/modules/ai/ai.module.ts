import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { PromptService } from './prompt.service';
import { PrismaService } from '../prisma/prisma.service';
import { VectorService } from './vector.service';
import { EmbeddingService } from './embedding.service';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    GeminiService,
    PromptService,
    PrismaService,
    VectorService,
    EmbeddingService,
  ],
  exports: [
    AiService,
    GeminiService,
    PromptService,
    PrismaService,
    VectorService,
    EmbeddingService,
  ]
})
export class AiModule {}
