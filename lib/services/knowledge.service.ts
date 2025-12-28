import { log } from '../logger';
import { namespace } from '../pinecone';
import { KNOWLEDGE } from '../constants';
import type { SearchRecordsOptions } from '@pinecone-database/pinecone/dist/data';
import type {
  KnowledgeRequest,
  KnowledgeResponse,
  KnowledgeResult,
  KnowledgeValidationResult,
} from '@/types/knowledge';

/**
 * Service class for knowledge base operations
 */
export class KnowledgeService {
  /**
   * Validate knowledge search request
   */
  static validateSearchRequest(
    request: KnowledgeRequest
  ): KnowledgeValidationResult {
    // Validate required query field
    if (!request.query || typeof request.query !== 'string') {
      return {
        valid: false,
        error: 'query is required and must be a string',
      };
    }

    // Validate and trim query
    const trimmedQuery = request.query.trim();
    if (trimmedQuery.length < KNOWLEDGE.QUERY_MIN_LENGTH) {
      return {
        valid: false,
        error: 'query cannot be empty',
      };
    }

    if (trimmedQuery.length > KNOWLEDGE.QUERY_MAX_LENGTH) {
      return {
        valid: false,
        error: `query must be less than ${KNOWLEDGE.QUERY_MAX_LENGTH} characters`,
      };
    }

    // Validate topK if provided
    const topK = request.topK !== undefined ? request.topK : KNOWLEDGE.TOPK_DEFAULT;
    if (typeof topK !== 'number' || topK < KNOWLEDGE.TOPK_MIN || topK > KNOWLEDGE.TOPK_MAX) {
      return {
        valid: false,
        error: `topK must be a number between ${KNOWLEDGE.TOPK_MIN} and ${KNOWLEDGE.TOPK_MAX}`,
      };
    }

    return {
      valid: true,
      query: trimmedQuery,
      topK,
    };
  }

  /**
   * Search knowledge base using semantic search
   */
  static async searchKnowledge(
    request: KnowledgeRequest
  ): Promise<KnowledgeResponse> {
    log.debug('Knowledge search request received', {
      queryLength: request.query?.length,
      hotel_name: request.hotel_name,
      category: request.category,
      location: request.location,
    });

    // Validate request
    const validation = this.validateSearchRequest(request);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const trimmedQuery = validation.query!;
    const topK = validation.topK!;

    // Build search options
    const options: SearchRecordsOptions = {
      query: {
        topK,
        inputs: { text: trimmedQuery },
      },
      fields: ['text', 'source_url'],
    };

    // Add location filter if provided
    if (request.location) {
      options.query.filter = { location: request.location };
      log.debug('Location filter applied', { location: request.location });
    }

    // Note: hotel_name and category are currently not used for filtering
    // TODO: Implement metadata filtering if these fields are stored as metadata in Pinecone
    // This could be done using the filter option in the search query
    if (request.hotel_name || request.category) {
      log.debug('Unused filters in request', {
        hotel_name: request.hotel_name,
        category: request.category,
      });
    }

    // Perform semantic search
    log.debug('Performing semantic search', { query: trimmedQuery, topK });
    const searchResults = await namespace.searchRecords(options);

    // Extract and format results
    // SearchRecordsResponse has structure: { result: { hits: Hit[] }, usage: SearchUsage }
    const hits = searchResults.result?.hits || [];
    const results: KnowledgeResult[] = hits.map((hit) => ({
      id: hit._id,
      text: (hit.fields as { text?: string })?.text,
      source_url: (hit.fields as { source_url?: string })?.source_url,
      score: hit._score,
    }));

    log.info('Knowledge search completed', {
      queryLength: trimmedQuery.length,
      resultCount: results.length,
      topK,
      location: request.location || 'none',
    });

    return {
      success: true,
      results,
      query: trimmedQuery,
      topK,
    };
  }

  /**
   * Format search results for display
   * Can be extended with additional formatting logic
   */
  static formatSearchResults(results: KnowledgeResult[]): KnowledgeResult[] {
    return results.map((result) => ({
      ...result,
      // Truncate text if needed (optional)
      text: result.text && result.text.length > 500
        ? result.text.substring(0, 500) + '...'
        : result.text,
    }));
  }
}

