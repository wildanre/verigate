import { createServer, type Server, type ServerResponse } from 'node:http';
import type { OrderStore } from './store/orders.js';
import type { ProviderLogger } from './provider.js';

/**
 * Minimal read-only HTTP API over the order store, so a separately-hosted
 * dashboard (e.g. on Vercel) can consume provider state. Read-only and
 * CORS-open — it exposes the same public order activity the dashboard shows.
 */
export function startHttpApi(store: OrderStore, port: number, logger?: ProviderLogger): Server {
  const server = createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    const path = (req.url ?? '').split('?')[0];
    try {
      if (path === '/health') return json(res, 200, { status: 'ok' });
      if (path === '/api/orders') return json(res, 200, { orders: store.listOrders(200) });
      if (path === '/api/metrics') return json(res, 200, store.metrics());
      return json(res, 404, { error: 'not found' });
    } catch (e) {
      return json(res, 500, { error: (e as Error).message });
    }
  });
  // A read-API failure (e.g. port in use) must not take down the CAP provider.
  server.on('error', (err) => {
    logger?.error?.(`read API disabled — failed to bind :${port}: ${(err as Error).message}`);
  });
  server.listen(port, () => logger?.info?.(`read API listening on :${port}`));
  return server;
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}
