import { EventType, isInsufficientBalance, type Event } from '@croo-network/sdk';
import type { StreamLike } from './provider.js';

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
 * nonce collisions. Events are filtered by negotiation_id so a requester agent
 * with multiple orders in flight does not cross-wire.
 */
export function attachRequester(
  stream: StreamLike,
  client: RequesterClient,
  opts: RequesterOptions,
  getNegotiationId?: () => string | undefined,
): Promise<Delivery> {
  const logger = opts.logger ?? console;
  let paying = false;

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

export function mapPayError(err: unknown): Error {
  if (isInsufficientBalance(err)) {
    return new Error(
      "insufficient USDC in the requester agent's AA wallet — deposit USDC to the agent's AA Wallet Address " +
        `(not the controller/executor address) and retry. (${(err as Error).message})`,
    );
  }
  return err instanceof Error ? err : new Error(String(err));
}
