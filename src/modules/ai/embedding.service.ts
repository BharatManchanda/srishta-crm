import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class EmbeddingService {
  private ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  async embed(text: string) {
    const res = await this.ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: text,
      config: {
        outputDimensionality: 1536,
      },
    });

    if (!res.embeddings?.length) {
      throw new InternalServerErrorException('Failed to generate embedding');
    }

    return res.embeddings[0].values;
    // return res.embeddings;;
  }
}