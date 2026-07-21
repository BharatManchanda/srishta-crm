export interface AiDocumentResult {
    id: number;
    content: string;
    title?: string;
    similarity: number;
}