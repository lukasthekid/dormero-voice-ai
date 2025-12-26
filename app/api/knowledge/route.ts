import { NextRequest, NextResponse } from 'next/server';
import { log } from '../../../lib/logger';
import { handleApiError, createErrorResponse } from '../../../lib/api-error-handler';
import { KnowledgeRequest, KnowledgeResponse } from '@/types/knowledge';
import { namespace } from '@/lib/pinecone';
import { SearchRecordsOptions } from '@pinecone-database/pinecone/dist/data';

// POST /api/knowledge
// Endpoint to search the knowledge base using semantic search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as KnowledgeRequest;

    log.debug('Knowledge search request received', {
      queryLength: body.query?.length,
      hotel_name: body.hotel_name,
      category: body.category,
    });

    // Note: hotel_name and category are currently not used for filtering
    // TODO: Implement metadata filtering if these fields are stored as metadata in Pinecone
    // This could be done using the filter option in the search query

    // Validate required field
    if (!body.query || typeof body.query !== 'string') {
      log.warn('Invalid knowledge search request', { body });
      return createErrorResponse('query is required and must be a string', 400);
    }

    // Validate query length
    const trimmedQuery = body.query.trim();
    if (trimmedQuery.length === 0) {
      return createErrorResponse('query cannot be empty', 400);
    }

    if (trimmedQuery.length > 1000) {
      return createErrorResponse('query must be less than 1000 characters', 400);
    }

    // Validate topK if provided
    const topK = body.topK !== undefined ? body.topK : 5;
    if (typeof topK !== 'number' || topK < 1 || topK > 50) {
      return createErrorResponse('topK must be a number between 1 and 50', 400);
    }
    var options: SearchRecordsOptions = {
      query: {
        topK,
        inputs: { text: trimmedQuery },
      },
      fields: ['text', 'source_url'],
    }
    if (body.location) {
      options.query.filter = { location: body.location }
    }
    // Perform semantic search
    const searchResults = await namespace.searchRecords(options);

    if (body.location) {
    }

    // Extract and format results
    // SearchRecordsResponse has structure: { result: { hits: Hit[] }, usage: SearchUsage }
    const hits = searchResults.result?.hits || [];
    const results = hits.map((hit) => ({
      id: hit._id,
      text: (hit.fields as { text?: string })?.text,
      source_url: (hit.fields as { source_url?: string })?.source_url,
      score: hit._score,
    }));

    log.info('Knowledge search completed', {
      queryLength: trimmedQuery.length,
      resultCount: results.length,
      topK,
    });

    const response: KnowledgeResponse = {
      success: true,
      results,
      query: trimmedQuery,
      topK,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, 'POST /api/knowledge');
  }
}

