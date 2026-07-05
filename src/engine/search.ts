import { TransientError } from '../errors.js';

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}

export interface SearchClient {
  search(query: string): Promise<SearchResult[]>;
}

type FetchLike = typeof fetch;

/** Tavily-backed web search with an in-memory per-instance cache. */
export class TavilySearch implements SearchClient {
  private cache = new Map<string, SearchResult[]>();

  constructor(
    private apiKey: string,
    private opts: { maxResults?: number; fetchImpl?: FetchLike } = {},
  ) {}

  async search(query: string): Promise<SearchResult[]> {
    const cached = this.cache.get(query);
    if (cached) return cached;

    const maxResults = this.opts.maxResults ?? 3;
    const doFetch = this.opts.fetchImpl ?? fetch;
    let data: { results?: { title?: string; url?: string; content?: string }[] };
    try {
      const resp = await doFetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.apiKey, query, max_results: maxResults }),
      });
      if (!resp.ok) throw new Error(`tavily responded ${resp.status}`);
      data = (await resp.json()) as typeof data;
    } catch (e) {
      throw new TransientError('web search failed', e);
    }

    const results = (data.results ?? []).slice(0, maxResults).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      content: r.content ?? '',
    }));
    this.cache.set(query, results);
    return results;
  }
}
