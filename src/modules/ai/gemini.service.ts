import { Injectable } from "@nestjs/common";
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiService {
    private ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });

    async chat(prompt: string) {
        const response = await this.ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
        });
        return response.text;
    }
}