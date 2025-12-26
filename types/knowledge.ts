export interface KnowledgeRequest {
    conversation_id: string;
    query: string;
    hotel_name?: string;
    location?: string;
    category?: string;
    topK?: number; // Optional: number of results to return (default: 5)
}

export interface KnowledgeResult {
    id: string;
    text?: string;
    source_url?: string;
    score?: number;
}

export interface KnowledgeResponse {
    success: true;
    results: KnowledgeResult[];
    query: string;
    topK: number;
}