import { describe, it, expect, vi } from 'vitest';
import { makeFactCheck } from './factcheck.js';
import { TransientError } from '../errors.js';
import type { LLM } from './llm.js';
import type { SearchClient } from './search.js';

function searchReturning(results = [{ title: 't', url: 'https://src', content: 'c' }]): SearchClient {
  return { search: vi.fn(async () => results) };
}

describe('makeFactCheck', () => {
  it('passes when all provided claims are supported', async () => {
    const llm: LLM = { completeJSON: vi.fn(async () => ({ result: 'supported', confidence: 0.9 }) as any) };
    const search = searchReturning();
    const r = await makeFactCheck(llm, search)({ claims: ['Base chain ID is 8453'] });
    expect(r.verdict).toBe('pass');
    expect(r.score).toBe(100);
    expect((r.checks as any[])[0].sources).toEqual(['https://src']);
  });

  it('fails when any claim is refuted', async () => {
    const llm: LLM = { completeJSON: vi.fn(async () => ({ result: 'refuted', confidence: 0.8 }) as any) };
    const r = await makeFactCheck(llm, searchReturning())({ claims: ['Base launched in 2019'] });
    expect(r.verdict).toBe('fail');
  });

  it('caps at 5 claims', async () => {
    const llm: LLM = { completeJSON: vi.fn(async () => ({ result: 'supported', confidence: 1 }) as any) };
    const search = searchReturning();
    const claims = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7'];
    await makeFactCheck(llm, search)({ claims });
    expect(search.search).toHaveBeenCalledTimes(5);
  });

  it('extracts claims from free text when no claims array is given', async () => {
    const llm: LLM = {
      completeJSON: vi
        .fn()
        .mockResolvedValueOnce({ claims: ['extracted claim'] })
        .mockResolvedValue({ result: 'supported', confidence: 0.9 }),
    };
    const search = searchReturning();
    const r = await makeFactCheck(llm, search)({ text: 'Some paragraph with a factual claim.' });
    expect(r.verdict).toBe('pass');
    expect(search.search).toHaveBeenCalledWith('extracted claim');
  });

  it('degrades gracefully with neither text nor claims', async () => {
    const llm: LLM = { completeJSON: vi.fn() };
    const search = searchReturning();
    const r = await makeFactCheck(llm, search)({});
    expect(r.verdict).toBe('fail');
    expect(search.search).not.toHaveBeenCalled();
  });

  it('propagates a transient search failure', async () => {
    const llm: LLM = { completeJSON: vi.fn(async () => ({ result: 'supported', confidence: 1 }) as any) };
    const search: SearchClient = { search: vi.fn(async () => { throw new TransientError('search down'); }) };
    await expect(makeFactCheck(llm, search)({ claims: ['x'] })).rejects.toBeInstanceOf(TransientError);
  });
});
