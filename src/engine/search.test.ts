import { describe, it, expect, vi } from 'vitest';
import { TavilySearch } from './search.js';
import { TransientError } from '../errors.js';

function okResponse(results: unknown[]) {
  return { ok: true, status: 200, json: async () => ({ results }) } as unknown as Response;
}

describe('TavilySearch', () => {
  it('returns mapped results and caches repeat queries', async () => {
    const fetchImpl = vi.fn(async () => okResponse([{ title: 't', url: 'https://u', content: 'c' }]));
    const search = new TavilySearch('key', { fetchImpl });

    const first = await search.search('base chain id');
    const second = await search.search('base chain id');

    expect(first).toEqual([{ title: 't', url: 'https://u', content: 'c' }]);
    expect(second).toEqual(first);
    expect(fetchImpl).toHaveBeenCalledOnce(); // cache hit on the second call
  });

  it('respects maxResults', async () => {
    const fetchImpl = vi.fn(async () =>
      okResponse([1, 2, 3, 4].map((n) => ({ title: `t${n}`, url: `u${n}`, content: 'c' }))),
    );
    const search = new TavilySearch('key', { fetchImpl, maxResults: 2 });
    expect(await search.search('q')).toHaveLength(2);
  });

  it('throws TransientError on a non-ok response', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) }) as unknown as Response);
    const search = new TavilySearch('key', { fetchImpl });
    await expect(search.search('q')).rejects.toBeInstanceOf(TransientError);
  });
});
