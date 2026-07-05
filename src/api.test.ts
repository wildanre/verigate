import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { once } from 'node:events';
import type { Server, AddressInfo } from 'node:net';
import { startHttpApi } from './api.js';
import { OrderStore } from './store/orders.js';

let server: Server;
let base: string;

beforeAll(async () => {
  const store = new OrderStore(':memory:');
  store.upsertOrder({ orderId: 'o1', serviceId: 'svc', requesterAgentId: 'a1', buyerWalletAddress: 'w1', status: 'settled' });
  server = startHttpApi(store, 0);
  await once(server, 'listening');
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

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

  it('404s an unknown path', async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });
});
