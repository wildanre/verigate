import { describe, it, expect, vi } from 'vitest';
import { makeGroundingCheck } from './grounding.js';
import { TransientError } from '../errors.js';
import type { LLM } from './llm.js';

function llmReturning(obj: unknown): LLM {
  return { completeJSON: vi.fn(async () => obj as any) };
}

const input = { source_text: 'Base has chain ID 8453.', generated_text: 'Base chain ID is 8453.' };

describe('makeGroundingCheck', () => {
  it('passes fully-grounded text', async () => {
    const verify = makeGroundingCheck(llmReturning({ grounding_score: 95, unsupported_sentences: [], verdict: 'pass' }));
    const r = await verify(input);
    expect(r.verdict).toBe('pass');
    expect(r.grounding_score).toBe(95);
  });

  it('fails and lists unsupported sentences', async () => {
    const verify = makeGroundingCheck(
      llmReturning({ grounding_score: 20, unsupported_sentences: ['Coinbase launched it in 2019.'], verdict: 'fail' }),
    );
    const r = await verify(input);
    expect(r.verdict).toBe('fail');
    expect(r.unsupported_sentences).toContain('Coinbase launched it in 2019.');
  });

  it('derives the verdict from score when the model omits it', async () => {
    const verify = makeGroundingCheck(llmReturning({ grounding_score: 90 }));
    expect((await verify(input)).verdict).toBe('pass');
    const partial = makeGroundingCheck(llmReturning({ grounding_score: 60 }));
    expect((await partial(input)).verdict).toBe('partial');
  });

  it('degrades gracefully without calling the LLM when input is missing', async () => {
    const llm = llmReturning({});
    const verify = makeGroundingCheck(llm);
    const r = await verify({ source_text: '' });
    expect(r.verdict).toBe('fail');
    expect(llm.completeJSON).not.toHaveBeenCalled();
  });

  it('propagates a transient LLM failure for retry', async () => {
    const llm: LLM = { completeJSON: vi.fn(async () => { throw new TransientError('boom'); }) };
    await expect(makeGroundingCheck(llm)(input)).rejects.toBeInstanceOf(TransientError);
  });
});
