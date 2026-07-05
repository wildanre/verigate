import { pathToFileURL } from 'node:url';
import { EventType, isInsufficientBalance, type Event } from '@croo-network/sdk';
import type { StreamLike } from '../src/provider.js';

export interface Delivery {
  deliverableType?: string;
  deliverableSchema?: string;
  deliverableText?: string;
  contentHash?: string;
}

export interface RequesterLogger {
  info?(...args: unknown[]): void;
  error?(...args: unknown[]): void;
}

/** Subset of AgentClient the requester calls (real client is assignable). */
export interface RequesterClient {
  connectWebSocket(): Promise<StreamLike>;
  negotiateOrder(req: { serviceId: string; requirements?: string }): Promise<{ negotiationId: string }>;
  payOrder(orderId: string): Promise<{ txHash: string }>;
  getDelivery(orderId: string): Promise<Delivery>;
}

export interface RequesterOptions {
  serviceId: string;
  requirements?: string;
  logger?: RequesterLogger;
}

/**
 * Attach requester handlers to a live stream and resolve with the delivery once
 * the order completes. Payment is guarded to fire once (never parallel) to avoid
 * nonce collisions. Exposed separately from {@link runRequester} for testing.
 */
export function attachRequester(
  stream: StreamLike,
  client: RequesterClient,
  opts: RequesterOptions,
  getNegotiationId?: () => string | undefined,
): Promise<Delivery> {
  const logger = opts.logger ?? console;
  let paying = false;

  // Ignore events that belong to a different order on the same agent WS. When
  // one requester agent has multiple orders in flight, events cross-wire
  // without this filter.
  const isMine = (e: Event): boolean => {
    const nid = getNegotiationId?.();
    return !nid || !e.negotiation_id || e.negotiation_id === nid;
  };

  return new Promise<Delivery>((resolve, reject) => {
    stream.on(EventType.OrderCreated, (e: Event) => {
      if (paying || !e.order_id || !isMine(e)) return;
      paying = true;
      client
        .payOrder(e.order_id)
        .then((res) => logger.info?.(`paid order ${e.order_id} (tx ${res.txHash})`))
        .catch((err) => reject(mapPayError(err)));
    });

    stream.on(EventType.OrderCompleted, (e: Event) => {
      if (!e.order_id || !isMine(e)) return;
      client
        .getDelivery(e.order_id)
        .then((delivery) => {
          stream.close?.();
          resolve(delivery);
        })
        .catch(reject);
    });

    stream.on(EventType.OrderRejected, (e: Event) => {
      if (!isMine(e)) return;
      reject(new Error(`order ${e.order_id} was rejected: ${e.reason ?? 'no reason given'}`));
    });
    stream.on(EventType.NegotiationRejected, (e: Event) => {
      if (!isMine(e)) return;
      reject(new Error(`negotiation was rejected: ${e.reason ?? 'no reason given'}`));
    });
  });
}

/** Full flow: connect, attach handlers, then start the negotiation. */
export async function runRequester(client: RequesterClient, opts: RequesterOptions): Promise<Delivery> {
  const stream = await client.connectWebSocket();
  let negotiationId: string | undefined;
  const result = attachRequester(stream, client, opts, () => negotiationId);
  const neg = await client.negotiateOrder({ serviceId: opts.serviceId, requirements: opts.requirements });
  negotiationId = neg.negotiationId;
  (opts.logger ?? console).info?.(`negotiation ${neg.negotiationId} started for service ${opts.serviceId}`);
  return result;
}

function mapPayError(err: unknown): Error {
  if (isInsufficientBalance(err)) {
    return new Error(
      "insufficient USDC in the requester agent's AA wallet — deposit USDC to the agent's AA Wallet Address " +
        `(not the controller/executor address) and retry. (${(err as Error).message})`,
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}

// --- CLI entrypoint (only when run directly, not when imported by tests) ---
async function main(): Promise<void> {
  const { loadConfig } = await import('../src/config.js');
  const { createClient } = await import('../src/cap/client.js');
  const cfg = loadConfig();
  const serviceId = process.env.CROO_TARGET_SERVICE_ID;
  if (!serviceId) throw new Error('CROO_TARGET_SERVICE_ID is required for the requester');

  // A default sample request for the grounding service; override via REQUIREMENTS env.
  const requirements =
    process.env.REQUIREMENTS ??
    JSON.stringify({
      source_text: 'Base is an Ethereum L2 with chain ID 8453.',
      generated_text: 'Base is an L2 with chain ID 8453, launched by Coinbase in 2019.',
    });

  const delivery = await runRequester(createClient(cfg), { serviceId, requirements });
  console.log('verification report:', delivery.deliverableSchema ?? delivery.deliverableText);
  process.exit(0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('requester failed:', err.message);
    process.exit(1);
  });
}
