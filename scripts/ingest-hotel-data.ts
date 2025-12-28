// scripts/ingest-hotel-data.ts

import "dotenv/config";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Pinecone } from "@pinecone-database/pinecone";
import * as cheerio from 'cheerio';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Track visited URLs to avoid duplicates
const visitedUrls = new Set<string>();
const processedHashes = new Set<string>();

// Clean extracted text
function cleanText(text: string): string {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .replace(/\t+/g, ' ')
        .trim();
}

// Generate hash of content for deduplication
function generateContentHash(content: string): string {
    return crypto.createHash('md5').update(content).digest('hex');
}

// Extract category from URL
function extractCategory(url: string, baseUrl: string): string {
    try {
        const urlObj = new URL(url);
        const basePath = new URL(baseUrl).pathname;
        const fullPath = urlObj.pathname;
        
        // Remove base path to get the category part
        const relativePath = fullPath.replace(basePath, '').replace(/^\/+|\/+$/g, '');
        
        if (!relativePath) return 'general';
        
        // Get first segment after base URL as category
        const segments = relativePath.split('/').filter(Boolean);
        return segments[0] || 'general';
    } catch (error) {
        return 'general';
    }
}

// Extract base path segment (e.g., "hotel-wien" from "/hotel-wien" or "/hotel-wien/")
function extractBasePathSegment(baseUrl: string): string | null {
    try {
        const baseObj = new URL(baseUrl);
        const pathname = baseObj.pathname.replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
        const segments = pathname.split('/').filter(Boolean);
        // Get the first meaningful segment (e.g., "hotel-wien")
        return segments[0] || null;
    } catch (error) {
        return null;
    }
}

// Normalize URL (remove hash, trailing slash, etc.)
function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Remove hash and query params
        urlObj.hash = '';
        urlObj.search = '';
        
        let pathname = urlObj.pathname;
        // Remove trailing slash (but keep root /)
        if (pathname.endsWith('/') && pathname.length > 1) {
            pathname = pathname.slice(0, -1);
        }
        urlObj.pathname = pathname;
        return urlObj.toString();
    } catch (error) {
        return url;
    }
}

// Check if a URL is under the base URL path (same origin and path starts with base path)
function isUrlUnderBaseUrl(url: string, baseUrl: string): boolean {
    try {
        const urlObj = new URL(url);
        const baseObj = new URL(baseUrl);
        
        // Must have same origin (protocol, hostname, port)
        if (urlObj.origin !== baseObj.origin) {
            return false;
        }
        
        // Normalize base pathname (ensure it starts with / and doesn't end with /)
        let basePathname = baseObj.pathname;
        if (!basePathname.startsWith('/')) {
            basePathname = '/' + basePathname;
        }
        if (basePathname.endsWith('/') && basePathname.length > 1) {
            basePathname = basePathname.slice(0, -1);
        }
        
        // Normalize URL pathname
        let urlPathname = urlObj.pathname;
        if (!urlPathname.startsWith('/')) {
            urlPathname = '/' + urlPathname;
        }
        if (urlPathname.endsWith('/') && urlPathname.length > 1) {
            urlPathname = urlPathname.slice(0, -1);
        }
        
        // Check if URL pathname starts with base pathname
        // Also allow the exact base pathname (with or without trailing slash handled)
        return urlPathname === basePathname || urlPathname.startsWith(basePathname + '/');
    } catch (error) {
        return false;
    }
}

// Extract all valid links from page
function extractLinks($: cheerio.CheerioAPI, currentUrl: string, baseUrl: string): string[] {
    const links: string[] = [];
    
    // IMPORTANT: Remove navigation elements that link to other hotels
    // Remove the hotel selector and any parent containers
    $('.header-hotelselect').remove();
    $('.header-hotelselect').parent().remove();
    $('[class*="hotel-select"], [class*="hotelselect"], [class*="hotel-nav"]').remove();
    
    // Now extract links from remaining content
    $('a[href]').each((_, element) => {
        const href = $(element).attr('href');
        if (!href) return;
        
        try {
            // Skip anchor links, mailto, tel, etc.
            if (href.startsWith('#') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') ||
                href.startsWith('javascript:')) {
                return;
            }
            
            // Convert relative URLs to absolute
            const absoluteUrl = new URL(href, baseUrl).toString();
            const normalized = normalizeUrl(absoluteUrl);
            
            // Apply all filters: must be unvisited and under base URL path
            if (!visitedUrls.has(normalized) && isUrlUnderBaseUrl(normalized, baseUrl)){
                links.push(normalized);
            }
        } catch (error) {
            // Invalid URL, skip silently
        }
    });
    
    const uniqueLinks = [...new Set(links)];
    
    // Debug: show what links were found (optional)
    if (uniqueLinks.length > 0) {
        console.log(`   Valid links found: ${uniqueLinks.slice(0, 5).join(', ')}${uniqueLinks.length > 5 ? '...' : ''}`);
    }
    
    return uniqueLinks;
}

async function scrapeAndChunk(
    url: string,
    baseUrl: string,
    hotel_name: string,
    location: string,
    maxDepth: number = 3,
    currentDepth: number = 0
): Promise<string[]> {
    
    const normalizedUrl = normalizeUrl(url);
    
    // Safety check: ensure URL is under base URL path
    if (!isUrlUnderBaseUrl(normalizedUrl, baseUrl)) {
        console.log(`${'  '.repeat(currentDepth)}🚫 Skipping URL outside base path: ${normalizedUrl}`);
        return [];
    }
    
    // Check if already visited
    if (visitedUrls.has(normalizedUrl)) {
        return [];
    }
    
    // Check depth limit
    if (currentDepth > maxDepth) {
        return [];
    }
    
    visitedUrls.add(normalizedUrl);
    
    console.log(`\n${'  '.repeat(currentDepth)}🔍 [Depth ${currentDepth}] ${normalizedUrl}`);
    
    try {
        // 1. Fetch the webpage
        const response = await fetch(normalizedUrl);
        if (!response.ok) {
            console.log(`${'  '.repeat(currentDepth)}❌ Failed: ${response.status}`);
            return [];
        }
        
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // 2. Extract links for crawling (BEFORE removing elements)
        const foundLinks = extractLinks($, normalizedUrl, baseUrl);
        console.log(`${'  '.repeat(currentDepth)}🔗 ${foundLinks.length} new links`);
        
        // 3. Remove noise elements for content extraction
        $('script, style, nav, header, footer, button').remove();
        $('.cookie-banner, .navigation, .menu, .header, .footer, .hotel-selector, .hotel-nav').remove();
        
        // 4. Extract content
        let content = '';
        const selectors = ['.central-content', 'main', 'article', '.content', 'body'];
        
        for (const selector of selectors) {
            const extracted = $(selector).text();
            if (extracted && extracted.length > 200) {
                content = extracted;
                break;
            }
        }
        
        if (!content || content.length < 100) {
            console.log(`${'  '.repeat(currentDepth)}⚠️  No content`);
            return foundLinks;
        }
        
        // 5. Clean and hash content
        content = cleanText(content);
        const contentHash = generateContentHash(content);
        
        if (processedHashes.has(contentHash)) {
            console.log(`${'  '.repeat(currentDepth)}⏭️  Duplicate content`);
            return foundLinks;
        }
        
        processedHashes.add(contentHash);
        
        // 6. Extract category from URL
        const category = extractCategory(normalizedUrl, baseUrl);
        console.log(`${'  '.repeat(currentDepth)}📁 ${category}`);
        
        // 7. Chunk content
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 800,
            chunkOverlap: 200,
            separators: ["\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "]
        });
        
        const documents = await splitter.createDocuments([content]);
        console.log(`${'  '.repeat(currentDepth)}📦 ${documents.length} chunks`);
        
        // 8. Upsert to Pinecone
        if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_HOST) {
            throw new Error('PINECONE_API_KEY and PINECONE_HOST must be set');
        }
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index = pinecone.index('llama-text-embed-v2-index', process.env.PINECONE_HOST);
        const namespace = index.namespace("__default__");
        
        const records = documents.map((chunk) => ({
            id: `${hotel_name.toLowerCase().replace(/\s+/g, '_')}_${category}_${uuidv4().slice(0, 8)}`,
            text: chunk.pageContent,
            hotel_name: hotel_name,
            hotel_id: hotel_name.toLowerCase().replace(/\s+/g, '_'),
            location: location,
            category: category,
            source_url: normalizedUrl,
            word_count: chunk.pageContent.split(/\s+/).length,
            char_count: chunk.pageContent.length,
            created_at: new Date().toISOString()
        }));
        
        await namespace.upsertRecords(records);
        console.log(`${'  '.repeat(currentDepth)}✅ Upserted`);
        
        return foundLinks;
        
    } catch (error) {
        console.error(`${'  '.repeat(currentDepth)}❌ Error:`, error);
        return [];
    }
}

// Recursive crawler with breadth-first search
async function crawlWebsite(
    startUrl: string,
    hotel_name: string,
    location: string,
    maxDepth: number = 2  // Reduced default depth
): Promise<void> {
    const baseUrl = startUrl;
    
    console.log('🏨 Starting hotel crawl');
    console.log(`📍 Base: ${baseUrl}`);
    console.log(`🔢 Max depth: ${maxDepth}`);
    console.log(`🏷️  Hotel: ${hotel_name}`);
    console.log('─'.repeat(80));
    
    // Queue for BFS: [url, depth]
    const queue: [string, number][] = [[startUrl, 0]];
    
    while (queue.length > 0) {
        const [currentUrl, depth] = queue.shift()!;
        
        // Process current page and get new links
        const newLinks = await scrapeAndChunk(
            currentUrl,
            baseUrl,
            hotel_name,
            location,
            maxDepth,
            depth
        );
        
        // Add new links to queue with incremented depth
        if (depth < maxDepth) {
            for (const link of newLinks) {
                if (!visitedUrls.has(link)) {
                    queue.push([link, depth + 1]);
                }
            }
        }
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

// clear database
async function clearDatabase() {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_HOST) {
        throw new Error('PINECONE_API_KEY and PINECONE_HOST must be set');
    }
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const index = pinecone.index('llama-text-embed-v2-index', process.env.PINECONE_HOST);
    const namespace = index.namespace("__default__");
    namespace.deleteAll();
    console.log('🧹 Database cleared');
}
// Main execution
async function main() {
    try {
        const startTime = Date.now();
        
        await crawlWebsite(
            'https://www.dormero.de/hotel-wien',
            'Dormero Hotel Vienna',
            'Vienna',
            3  // Depth 2 should be enough for most hotels
        );

        await crawlWebsite(
            'https://www.dormero.de/hotel-stuttgart',
            'Dormero Hotel Stuttgart',
            'Stuttgart',
            3  // Depth 2 should be enough for most hotels
        );
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        
        console.log('\n' + '═'.repeat(80));
        console.log('🎉 Crawl complete!');
        console.log(`📊 Statistics:`);
        console.log(`   - Pages visited: ${visitedUrls.size}`);
        console.log(`   - Unique content: ${processedHashes.size}`);
        console.log(`   - Duration: ${duration}s`);
        console.log('═'.repeat(80));
        
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

main();
//clearDatabase()
