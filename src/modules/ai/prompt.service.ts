import { Injectable } from '@nestjs/common';

@Injectable()
export class PromptService {

    build(question: string, docs: any[]) {

        const context = docs.map(d => d.content).join("\n-----------------\n");

        return `You are CRM AI Assistant.
            Use ONLY the context below.
            Context: ${context}
            Question: ${question}
            Answer:`;

    }
}