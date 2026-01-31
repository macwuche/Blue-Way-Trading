interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  snippet: string;
  url: string;
  image_url: string | null;
  published_at: string;
  source: string;
  relevance_score: number | null;
  entities: Array<{
    symbol: string;
    name: string;
    type: string;
    match_score: number;
  }>;
}

interface MarketauxResponse {
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
  data: NewsArticle[];
}

interface CachedNews {
  data: NewsArticle[];
  meta: MarketauxResponse["meta"];
  timestamp: number;
  cacheKey: string;
}

interface NewsQueryParams {
  symbols?: string;
  search?: string;
  published_after?: string;
  published_before?: string;
  page?: number;
  limit?: number;
}

const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY;
const API_BASE_URL = "https://api.marketaux.com/v1/news/all";

// Cache settings
const CACHE_DURATION_MS = 3 * 60 * 1000; // 3 minutes cache
const newsCache = new Map<string, CachedNews>();

// Rate limiting settings
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 API calls per minute
let requestCount = 0;
let windowStart = Date.now();

// Pending requests to prevent duplicate API calls
const pendingRequests = new Map<string, Promise<CachedNews | null>>();

function generateCacheKey(params: NewsQueryParams): string {
  return JSON.stringify({
    symbols: params.symbols || "",
    search: params.search || "",
    published_after: params.published_after || "",
    published_before: params.published_before || "",
    page: params.page || 1,
    limit: params.limit || 10,
  });
}

function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset window if expired
  if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
    windowStart = now;
    requestCount = 0;
  }
  
  if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
    console.log("[Marketaux API] Rate limit reached, using cached data");
    return false;
  }
  
  return true;
}

export async function fetchMarketNews(params: NewsQueryParams): Promise<CachedNews | null> {
  if (!MARKETAUX_API_KEY) {
    console.warn("[Marketaux API] No API key configured");
    return null;
  }

  const cacheKey = generateCacheKey(params);
  
  // Check cache first
  const cached = newsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    console.log("[Marketaux API] Returning cached news for:", cacheKey);
    return cached;
  }

  // Check if there's already a pending request for this exact query
  const pendingRequest = pendingRequests.get(cacheKey);
  if (pendingRequest) {
    console.log("[Marketaux API] Waiting for pending request:", cacheKey);
    return pendingRequest;
  }

  // Check rate limit
  if (!checkRateLimit()) {
    // Return stale cache if available
    if (cached) {
      return cached;
    }
    return null;
  }

  // Create new request
  const requestPromise = (async (): Promise<CachedNews | null> => {
    try {
      const queryParams = new URLSearchParams({
        api_token: MARKETAUX_API_KEY,
        language: "en",
        filter_entities: "true",
        limit: String(params.limit || 10),
        page: String(params.page || 1),
      });

      if (params.symbols) {
        queryParams.set("symbols", params.symbols);
      }
      if (params.search) {
        queryParams.set("search", params.search);
      }
      if (params.published_after) {
        queryParams.set("published_after", params.published_after);
      }
      if (params.published_before) {
        queryParams.set("published_before", params.published_before);
      }

      const url = `${API_BASE_URL}?${queryParams.toString()}`;
      console.log("[Marketaux API] Fetching news:", url.replace(MARKETAUX_API_KEY, "***"));

      requestCount++;
      const response = await fetch(url);

      if (!response.ok) {
        console.error("[Marketaux API] Error:", response.status, response.statusText);
        // Return stale cache on error
        if (cached) {
          return cached;
        }
        return null;
      }

      const data = (await response.json()) as MarketauxResponse;

      const result: CachedNews = {
        data: data.data || [],
        meta: data.meta,
        timestamp: Date.now(),
        cacheKey,
      };

      // Update cache
      newsCache.set(cacheKey, result);
      console.log("[Marketaux API] Fetched and cached", result.data.length, "articles");

      return result;
    } catch (error) {
      console.error("[Marketaux API] Fetch error:", error);
      // Return stale cache on error
      if (cached) {
        return cached;
      }
      return null;
    } finally {
      // Clean up pending request
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(newsCache.entries());
  for (const [key, value] of entries) {
    // Remove entries older than 30 minutes
    if (now - value.timestamp > 30 * 60 * 1000) {
      newsCache.delete(key);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

export type { NewsArticle, NewsQueryParams, CachedNews };
