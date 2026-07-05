import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import type { OrderStore } from './store/orders.js';
import type { ProviderLogger } from './provider.js';
import type { Verifier, ServiceKind } from './types.js';
import { buildReport } from './report.js';

export interface ApiOptions {
  logger?: ProviderLogger;
  /** Verifiers for the free `/api/try` preview (no CAP order). */
  verifiers?: Partial<Record<ServiceKind, Verifier>>;
}

const MAX_BODY_BYTES = 20_000;

/**
 * Read-only order API plus a free `/api/try` verification preview:
 * - GET /health, /api/orders, /api/metrics — dashboard consumes these.
 * - POST /api/try {service, ...input} — runs a verifier directly (no payment),
 *   so anyone can try VeriGate before hiring it over CAP.
 * CORS-open and read-only over order data. A bind failure is non-fatal.
 */
export function startHttpApi(store: OrderStore, port: number, opts: ApiOptions = {}): Server {
  const server = createServer((req, res) => {
    handle(req, res, store, opts).catch((e) => json(res, 500, { error: (e as Error).message }));
  });
  server.on('error', (err) => {
    opts.logger?.error?.(`read API disabled — failed to bind :${port}: ${(err as Error).message}`);
  });
  server.listen(port, () => opts.logger?.info?.(`read API listening on :${port}`));
  return server;
}

async function handle(req: IncomingMessage, res: ServerResponse, store: OrderStore, opts: ApiOptions): Promise<void> {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = (req.url ?? '').split('?')[0];

  if (req.method === 'GET') {
    if (path === '/health') return json(res, 200, { status: 'ok' });
    if (path === '/api/orders') return json(res, 200, { orders: store.listOrders(200) });
    if (path === '/api/metrics') return json(res, 200, store.metrics());
    if (path.startsWith('/api/orders/')) {
      const id = decodeURIComponent(path.slice('/api/orders/'.length));
      const order = store.getOrder(id);
      return order ? json(res, 200, { order }) : json(res, 404, { error: 'order not found' });
    }
  }

  if (req.method === 'POST' && path === '/api/try') {
    return handleTry(req, res, opts);
  }

  return json(res, 404, { error: 'not found' });
}

async function handleTry(req: IncomingMessage, res: ServerResponse, opts: ApiOptions): Promise<void> {
  let body: { service?: string } & Record<string, unknown>;
  try {
    body = await readJsonBody(req);
  } catch (e) {
    return json(res, 400, { error: (e as Error).message });
  }

  const kind = body.service as ServiceKind | undefined;
  const verifier = kind ? opts.verifiers?.[kind] : undefined;
  if (!verifier) {
    return json(res, 400, { error: `unknown or unavailable service: ${body.service ?? '(none)'}` });
  }

  try {
    const { service: _service, ...input } = body;
    const result = await verifier(input);
    return json(res, 200, { report: buildReport(result) });
  } catch (e) {
    return json(res, 422, { error: (e as Error).message });
  }
}

function readJsonBody(req: IncomingMessage, limit = MAX_BODY_BYTES): Promise<{ service?: string } & Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('request body too large'));
        req.destroy();
      } else {
        data += chunk;
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}
