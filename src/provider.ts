import { DeliverableType, EventType, type Event } from '@croo-network/sdk';
import { OrderStore } from './store/orders.js';
import { runVerification, type EngineDeps } from './engine/index.js';
import { isPermanent } from './errors.js';

/** Minimal event stream surface the provider needs (SDK EventStream satisfies it). */
export interface StreamLike {
  on(eventType: string, handler: (e: Event) => void): void;
  onAny?(handler: (e: Event) => void): void;
  close?(): void;
}

/**
 * Order fields the provider reads (SDK Order satisfies it structurally).
 * Note: the CROO `Order` carries no `requirements` — those live on the
 * `Negotiation`, fetched via `negotiationId`.
 */
export interface ProviderOrder {
  orderId: string;
  serviceId: string;
  negotiationId: string;
  status?: string;
  requesterAgentId?: string;
  requesterWalletAddress?: string;
  price?: string;
}

/** Negotiation fields the provider reads (SDK Negotiation satisfies it). */
export interface ProviderNegotiation {
  requirements: string;
  requesterAgentId?: string;
}

export interface DeliverPayload {
  deliverableType: string;
  deliverableSchema?: string;
  deliverableText?: string;
}

/** Subset of AgentClient the provider calls (real client is assignable). */
export interface ProviderClient {
  connectWebSocket(): Promise<StreamLike>;
  acceptNegotiation(negotiationId: string): Promise<{ order: { orderId: string } }>;
  getOrder(orderId: string): Promise<ProviderOrder>;
  getNegotiation(negotiationId: string): Promise<ProviderNegotiation>;
  deliverOrder(orderId: string, req: DeliverPayload): Promise<{ txHash: string }>;
  rejectOrder(orderId: string, reason: string): Promise<void>;
}

export interface ProviderLogger {
  info?(...args: unknown[]): void;
  warn?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
}

export interface RetryConfig {
  attempts: number;
  delayMs: number;
}

export interface ProviderDeps {
  client: ProviderClient;
  store: OrderStore;
  engine: EngineDeps;
  logger?: ProviderLogger;
  retry?: RetryConfig;
}

const DEFAULT_RETRY: RetryConfig = { attempts: 3, delayMs: 200 };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(fn: () => Promise<T>, cfg: RetryConfig, logger?: ProviderLogger): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= cfg.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (isPermanent(err)) throw err; // never retry a permanent failure
      lastErr = err;
      logger?.warn?.(`attempt ${attempt}/${cfg.attempts} failed: ${(err as Error).message}`);
      if (attempt < cfg.attempts && cfg.delayMs > 0) await sleep(cfg.delayMs);
    }
  }
  throw lastErr;
}

function isOurService(serviceId: string | undefined, ids: EngineDeps['serviceIds']): boolean {
  const known = [ids.factcheck, ids.grounding, ids.schema].filter(Boolean) as string[];
  if (known.length === 0) return true; // dev fallback: accept all when unconfigured
  return !!serviceId && known.includes(serviceId);
}

/**
 * Handle a paid order: verify and deliver. Idempotent — a re-delivered order is
 * skipped. A permanent verification failure rejects the order (escrow refund);
 * transient failures throw so the caller's retry wrapper can re-attempt.
 */
export async function processPaidOrder(orderId: string, deps: ProviderDeps): Promise<'delivered' | 'rejected' | 'skipped'> {
  if (deps.store.isDelivered(orderId)) return 'skipped';

  const order = await deps.client.getOrder(orderId);
  const negotiation = await deps.client.getNegotiation(order.negotiationId);
  deps.store.upsertOrder({
    orderId,
    serviceId: order.serviceId,
    requesterAgentId: order.requesterAgentId ?? negotiation.requesterAgentId ?? null,
    buyerWalletAddress: order.requesterWalletAddress ?? null,
    status: 'paid',
    price: order.price ?? null,
  });

  let report;
  try {
    report = await runVerification(
      { orderId, serviceId: order.serviceId, requirements: negotiation.requirements },
      deps.engine,
    );
  } catch (err) {
    if (isPermanent(err)) {
      await deps.client.rejectOrder(orderId, (err as Error).message);
      deps.store.markStatus(orderId, 'rejected');
      deps.logger?.warn?.(`rejected ${orderId}: ${(err as Error).message}`);
      return 'rejected';
    }
    throw err; // transient -> retried by caller
  }

  if (deps.store.isDelivered(orderId)) return 'skipped';
  const res = await deps.client.deliverOrder(orderId, {
    deliverableType: DeliverableType.Schema,
    deliverableSchema: JSON.stringify(report),
  });
  deps.store.recordReport(orderId, report, res.txHash);
  deps.store.markStatus(orderId, 'delivering');
  deps.logger?.info?.(`delivered ${orderId} (${report.verdict})`);
  return 'delivered';
}

async function handleOrderPaid(e: Event, deps: ProviderDeps): Promise<void> {
  const orderId = e.order_id;
  if (!orderId) return;
  try {
    await withRetry(() => processPaidOrder(orderId, deps), deps.retry ?? DEFAULT_RETRY, deps.logger);
  } catch (err) {
    deps.logger?.error?.(`order ${orderId} failed after retries: ${(err as Error).message}`);
  }
}

async function handleNegotiation(e: Event, deps: ProviderDeps): Promise<void> {
  const negotiationId = e.negotiation_id;
  if (!negotiationId) return;
  if (!isOurService(e.service_id, deps.engine.serviceIds)) {
    deps.logger?.info?.(`ignoring negotiation for foreign service ${e.service_id}`);
    return;
  }
  try {
    const res = await deps.client.acceptNegotiation(negotiationId);
    deps.store.upsertOrder({ orderId: res.order.orderId, serviceId: e.service_id ?? null, status: 'created' });
    deps.logger?.info?.(`accepted negotiation ${negotiationId} -> order ${res.order.orderId}`);
  } catch (err) {
    deps.logger?.error?.(`accept failed for ${negotiationId}: ${(err as Error).message}`);
  }
}

function handleOrderCompleted(e: Event, deps: ProviderDeps): void {
  if (!e.order_id) return;
  deps.store.upsertOrder({ orderId: e.order_id, status: 'completed' });
  deps.store.markStatus(e.order_id, 'completed');
  deps.logger?.info?.(`completed ${e.order_id}`);
}

const FINAL_STATUSES = new Set(['completed', 'settled', 'rejected', 'expired']);

/**
 * Reconcile in-flight orders against CROO. The `order_completed` WS event can be
 * missed (reconnects, timing), leaving orders stuck at 'created'/'paid'/
 * 'delivering'. This polls CROO for each non-final order and syncs its status,
 * so the store (and dashboard) become eventually consistent.
 */
export async function reconcileOrders(deps: Pick<ProviderDeps, 'client' | 'store' | 'logger'>): Promise<void> {
  const inflight = deps.store.listOrders(200).filter((o) => !o.status || !FINAL_STATUSES.has(o.status));
  for (const o of inflight) {
    try {
      const order = await deps.client.getOrder(o.orderId);
      if (order.status && order.status !== o.status) {
        deps.store.markStatus(o.orderId, order.status);
        deps.logger?.info?.(`reconciled ${o.orderId}: ${o.status} -> ${order.status}`);
      }
    } catch (err) {
      deps.logger?.warn?.(`reconcile ${o.orderId} failed: ${(err as Error).message}`);
    }
  }
}

/** Wire all event handlers onto a stream. Exposed for tests. */
export function registerHandlers(stream: StreamLike, deps: ProviderDeps): void {
  // Handlers return their promise so a driving stream (e.g. tests) can await
  // completion; the SDK's EventStream ignores the return value in production.
  stream.on(EventType.NegotiationCreated, (e) => handleNegotiation(e, deps));
  stream.on(EventType.OrderPaid, (e) => handleOrderPaid(e, deps));
  stream.on(EventType.OrderCompleted, (e) => handleOrderCompleted(e, deps));
  if (typeof stream.onAny === 'function') {
    stream.onAny((e) => deps.store.appendEvent(e.type, e.order_id ?? null, e.raw));
  }
}

/** Connect, register handlers, and return the live stream. */
export async function startProvider(deps: ProviderDeps): Promise<StreamLike> {
  const stream = await deps.client.connectWebSocket();
  registerHandlers(stream, deps);
  deps.logger?.info?.('VeriGate online — waiting for orders');
  return stream;
}
