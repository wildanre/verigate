import { describe, it, expect, vi } from 'vitest';
import { runVerification, resolveKind, parseRequirements, type EngineDeps } from './index.js';
import { InvalidInputError } from '../errors.js';

const ids = { schema: 'svc-schema', grounding: 'svc-grounding', factcheck: 'svc-factcheck' };

describe('resolveKind', () => {
  it('maps serviceId to the right kind', () => {
    expect(resolveKind('svc-schema', ids)).toBe('schema');
    expect(resolveKind('svc-grounding', ids)).toBe('grounding');
    expect(resolveKind('svc-factcheck', ids)).toBe('factcheck');
  });
  it('returns undefined for an unknown serviceId', () => {
    expect(resolveKind('svc-unknown', ids)).toBeUndefined();
    expect(resolveKind('', ids)).toBeUndefined();
  });
});

describe('parseRequirements', () => {
  it('parses a JSON object', () => {
    expect(parseRequirements('{"a":1}')).toEqual({ a: 1 });
  });
  it('throws InvalidInputError on bad JSON', () => {
    expect(() => parseRequirements('{not json')).toThrow(InvalidInputError);
  });
  it('throws InvalidInputError on a non-object', () => {
    expect(() => parseRequirements('[1,2]')).toThrow(InvalidInputError);
    expect(() => parseRequirements('')).toThrow(InvalidInputError);
  });
});

describe('runVerification', () => {
  it('routes to the correct verifier and signs the report', async () => {
    const schemaVerifier = vi.fn(async () => ({ verdict: 'pass' as const }));
    const deps: EngineDeps = { verifiers: { schema: schemaVerifier }, serviceIds: ids };
    const report = await runVerification(
      { orderId: 'o1', serviceId: 'svc-schema', requirements: '{"output":{}}' },
      deps,
    );
    expect(schemaVerifier).toHaveBeenCalledOnce();
    expect(report.verdict).toBe('pass');
    expect(report.report_hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('throws InvalidInputError for an unknown serviceId', async () => {
    const deps: EngineDeps = { verifiers: {}, serviceIds: ids };
    await expect(
      runVerification({ orderId: 'o1', serviceId: 'svc-x', requirements: '{}' }, deps),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('throws InvalidInputError for malformed requirements', async () => {
    const deps: EngineDeps = { verifiers: { schema: async () => ({ verdict: 'pass' }) }, serviceIds: ids };
    await expect(
      runVerification({ orderId: 'o1', serviceId: 'svc-schema', requirements: 'nope' }, deps),
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
