import { describe, it, expect, vi } from 'vitest';
import { createHire, parseDelivery, buildServer } from './mcp-server.js';

describe('parseDelivery', () => {
  it('parses a schema deliverable', () => {
    expect(parseDelivery({ deliverableSchema: '{"verdict":"pass"}' })).toEqual({ verdict: 'pass' });
  });
  it('parses a text deliverable', () => {
    expect(parseDelivery({ deliverableText: '{"verdict":"fail"}' })).toEqual({ verdict: 'fail' });
  });
  it('defaults empty deliveries to {}', () => {
    expect(parseDelivery({})).toEqual({});
  });
});

describe('createHire', () => {
  it('places an order with stringified requirements and returns the parsed report', async () => {
    const runOrder = vi.fn(async (_svc: string, req: string) => ({
      deliverableSchema: JSON.stringify({ verdict: 'pass', echoed: JSON.parse(req) }),
    }));
    const hire = createHire(runOrder);
    const r = await hire('svc-1', { output: 1 });
    expect(runOrder).toHaveBeenCalledWith('svc-1', JSON.stringify({ output: 1 }));
    expect(r).toEqual({ verdict: 'pass', echoed: { output: 1 } });
  });

  it('serializes concurrent hires — never two orders in flight', async () => {
    let active = 0;
    let maxActive = 0;
    const runOrder = vi.fn(async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
      return { deliverableSchema: '{"verdict":"pass"}' };
    });
    const hire = createHire(runOrder);
    await Promise.all([hire('a', {}), hire('b', {}), hire('c', {})]);
    expect(maxActive).toBe(1);
    expect(runOrder).toHaveBeenCalledTimes(3);
  });

  it('keeps the queue alive after a failed hire', async () => {
    const runOrder = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue({ deliverableSchema: '{"verdict":"pass"}' });
    const hire = createHire(runOrder);
    await expect(hire('a', {})).rejects.toThrow('boom');
    await expect(hire('b', {})).resolves.toEqual({ verdict: 'pass' });
  });
});

describe('buildServer', () => {
  it('constructs the MCP server with tools registered', () => {
    const server = buildServer(async () => ({}));
    expect(server).toBeTruthy();
  });
});
