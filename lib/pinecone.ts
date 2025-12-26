import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import { log } from './logger';

// Validate environment variables
const apiKey = process.env.PINECONE_API_KEY;
const host = process.env.PINECONE_HOST;

if (!apiKey) {
  throw new Error('PINECONE_API_KEY environment variable is not set');
}

if (!host) {
  throw new Error('PINECONE_HOST environment variable is not set');
}

// Initialize Pinecone client
const pinecone = new Pinecone({ apiKey });
const index = pinecone.index('llama-text-embed-v2-index', host);
const namespace = index.namespace("__default__");

log.debug('Pinecone client initialized', {
  indexName: 'llama-text-embed-v2-index',
  namespace: '__default__',
});

export { index, namespace };