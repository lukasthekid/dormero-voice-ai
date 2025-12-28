/**
 * Knowledge base search request
 */
export interface KnowledgeRequest {
    conversation_id: string;
    query: string;
    hotel_name?: string;
    location?: string;
    category?: string;
    topK?: number; // Optional: number of results to return (default: 5)
}

/**
 * Knowledge base search result
 */
export interface KnowledgeResult {
    id: string;
    text?: string;
    source_url?: string;
    score?: number;
}

/**
 * Knowledge base search response
 */
export interface KnowledgeResponse {
    success: true;
    results: KnowledgeResult[];
    query: string;
    topK: number;
}

/**
 * Validation result for knowledge search
 */
export interface KnowledgeValidationResult {
    valid: boolean;
    error?: string;
    query?: string;
    topK?: number;
}