import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { once } from 'node:events';
import type { Server, AddressInfo } from 'node:net';
import { startHttpApi } from './api.js';
import { OrderStore } from './store/orders.js';
import { validateSchema } from './engine/schema.js';

let server: Server;
let base: string;

beforeAll(async () => {
  const store = new OrderStore(':memory:');
  store.upsertOrder({ orderId: 'o1', serviceId: 'svc', requesterAgentId: 'a1', buyerWalletAddress: 'w1', status: 'settled' });
  server = startHttpApi(store, 0, { verifiers: { schema: validateSchema } });
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

async function post(path: string, body: unknown) {
  return fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

afterAll(() => {
  server.close();
});

describe('read HTTP API', () => {
  it('serves /health', async () => {
    const r = await fetch(`${base}/health`);
    expect(r.status).toBe(200);
    expect((await r.json()).status).toBe('ok');
  });

  it('serves /api/orders', async () => {
    const j = await (await fetch(`${base}/api/orders`)).json();
    expect(j.orders).toHaveLength(1);
    expect(j.orders[0].orderId).toBe('o1');
  });

  it('serves /api/metrics', async () => {
    const j = await (await fetch(`${base}/api/metrics`)).json();
    expect(j.total).toBe(1);
    expect(j.uniqueCounterparties).toBe(1);
  });

  it('serves a single order by id', async () => {
    const j = await (await fetch(`${base}/api/orders/o1`)).json();
    expect(j.order.orderId).toBe('o1');
  });

  it('404s an unknown order id', async () => {
    expect((await fetch(`${base}/api/orders/nope`)).status).toBe(404);
  });

  it('404s an unknown path', async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });

  it('runs a free /api/try schema preview', async () => {
    const r = await post('/api/try', {
      service: 'schema',
      output: { name: 'Ada' },
      expected_schema: { type: 'object', required: ['name', 'age'] },
    });
    expect(r.status).toBe(200);
    const j = await r.json();
    expect(j.report.verdict).toBe('fail');
    expect(j.report.report_hash).toMatch(/^0x[0-9a-f]{64}$/);
  });

  it('rejects /api/try for an unavailable service', async () => {
    const r = await post('/api/try', { service: 'grounding', source_text: 'x', generated_text: 'y' });
    expect(r.status).toBe(400); // grounding verifier not registered in this test
  });
});
