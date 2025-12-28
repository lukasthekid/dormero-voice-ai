import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createErrorResponse } from '../../../lib/api-error-handler';
import { KnowledgeService } from '../../../lib/services/knowledge.service';
import type { KnowledgeRequest } from '@/types/knowledge';

// POST /api/knowledge
// Endpoint to search the knowledge base using semantic search
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as KnowledgeRequest;

    // Search knowledge base using service
    // Service handles validation and search logic
    const response = await KnowledgeService.searchKnowledge(body);

    return NextResponse.json(response);
  } catch (error) {
    // Handle validation errors
    if (error instanceof Error && (
      error.message.includes('query') ||
      error.message.includes('topK') ||
      error.message.includes('required')
    )) {
      return createErrorResponse(error.message, 400);
    }
    // Handle other errors
    return handleApiError(error, 'POST /api/knowledge');
  }
}

