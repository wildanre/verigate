import { describe, it, expect, vi } from 'vitest';
import { DeliverableType, EventType } from '@croo-network/sdk';
import { startProvider, reconcileOrders, type ProviderClient, type ProviderDeps, type StreamLike } from './provider.js';
import { OrderStore } from './store/orders.js';
import { validateSchema } from './engine/schema.js';

const serviceIds = { schema: 'svc-schema', grounding: 'svc-grounding', factcheck: 'svc-factcheck' };
const personSchema = { type: 'object', required: ['name'], properties: { name: { type: 'string' } } };

class FakeStream implements StreamLike {
  private handlers = new Map<string, (e: any) => any>();
  on(type: string, h: (e: any) => any) {
    this.handlers.set(type, h);
  }
  async emit(type: string, e: any) {
    return await this.handlers.get(type)?.(e);
  }
}

function makeDeps(overrides: Partial<ProviderClient> = {}) {
  const stream = new FakeStream();
  const client: ProviderClient = {
    connectWebSocket: async () => stream,
    acceptNegotiation: vi.fn(async () => ({ order: { orderId: 'o1' } })),
    getOrder: vi.fn(async () => ({
      orderId: 'o1',
      serviceId: 'svc-schema',
      negotiationId: 'neg1',
      requesterAgentId: 'a1',
      requesterWalletAddress: 'w1',
      price: '0.015',
    })),
    getNegotiation: vi.fn(async () => ({
      requirements: JSON.stringify({ output: { name: 'Ada' }, expected_schema: personSchema }),
      requesterAgentId: 'a1',
    })),
    deliverOrder: vi.fn(async () => ({ txHash: '0xtx' })),
    rejectOrder: vi.fn(async () => {}),
    ...overrides,
  };
  const store = new OrderStore(':memory:');
  const deps: ProviderDeps = {
    client,
    store,
    engine: { verifiers: { schema: validateSchema }, serviceIds },
    retry: { attempts: 3, delayMs: 0 },
  };
  return { stream, client, store, deps };
}

describe('provider order lifecycle', () => {
  it('AE1: delivers a schema report for a paid order', async () => {
    const { stream, client, store, deps } = makeDeps();
    await startProvider(deps);
    await stream.emit(EventType.OrderPaid, { order_id: 'o1', service_id: 'svc-schema' });

    expect(client.deliverOrder).toHaveBeenCalledOnce();
    const [orderId, payload] = (client.deliverOrder as any).mock.calls[0];
    expect(orderId).toBe('o1');
    expect(payload.deliverableType).toBe(DeliverableType.Schema);
    expect(JSON.parse(payload.deliverableSchema).verdict).toBe('pass');
    expect(store.isDelivered('o1')).toBe(true);
    expect(store.getOrder('o1')?.report).toBeTruthy();
  });

  it('AE2: rejects an order whose requirements are permanently invalid', async () => {
    const { stream, client, store, deps } = makeDeps({
      getNegotiation: vi.fn(async () => ({ requirements: 'not json' })),
    });
    await startProvider(deps);
    await stream.emit(EventType.OrderPaid, { order_id: 'o1', service_id: 'svc-schema' });

    expect(client.rejectOrder).toHaveBeenCalledOnce();
    expect(client.deliverOrder).not.toHaveBeenCalled();
    expect(store.getOrder('o1')?.status).toBe('rejected');
  });

  it('AE3: retries a transient deliver failure without double-persisting', async () => {
    const deliverOrder = vi
      .fn()
      .mockRejectedValueOnce(new Error('on-chain revert'))
      .mockResolvedValue({ txHash: '0xtx' });
    const { stream, store, deps } = makeDeps({ deliverOrder });
    await startProvider(deps);
    await stream.emit(EventType.OrderPaid, { order_id: 'o1', service_id: 'svc-schema' });

    expect(deliverOrder).toHaveBeenCalledTimes(2);
    expect(store.isDelivered('o1')).toBe(true);
    expect(store.getOrder('o1')?.deliverTxHash).toBe('0xtx');
  });

  it('accepts a negotiation for our service', async () => {
    const { stream, client, deps } = makeDeps();
    await startProvider(deps);
    await stream.emit(EventType.NegotiationCreated, { negotiation_id: 'n1', service_id: 'svc-schema' });
    expect(client.acceptNegotiation).toHaveBeenCalledWith('n1');
  });

  it('ignores a negotiation for a foreign service', async () => {
    const { stream, client, deps } = makeDeps();
    await startProvider(deps);
    await stream.emit(EventType.NegotiationCreated, { negotiation_id: 'n2', service_id: 'svc-someone-else' });
    expect(client.acceptNegotiation).not.toHaveBeenCalled();
  });

  it('marks an order completed on the completion event', async () => {
    const { stream, store, deps } = makeDeps();
    await startProvider(deps);
    await stream.emit(EventType.OrderCompleted, { order_id: 'o1' });
    expect(store.getOrder('o1')?.status).toBe('completed');
  });

  it('reconcileOrders syncs stuck in-flight orders from CROO', async () => {
    const store = new OrderStore(':memory:');
    store.upsertOrder({ orderId: 'stuck', serviceId: 'svc-schema', status: 'delivering' });
    store.markDelivered('stuck'); // delivered — reconcile should only sync status
    store.upsertOrder({ orderId: 'done', serviceId: 'svc-schema', status: 'completed' });
    const getOrder = vi.fn(async (id: string) => ({ orderId: id, serviceId: 'svc-schema', negotiationId: 'n', status: 'completed' }));
    const deps = { client: { getOrder } as any, store, engine: { verifiers: {}, serviceIds } };
    await reconcileOrders(deps as any);
    expect(getOrder).toHaveBeenCalledTimes(1); // only the non-final 'stuck' order
    expect(store.getOrder('stuck')?.status).toBe('completed');
  });

  it('reconcileOrders re-delivers a paid-but-undelivered order', async () => {
    const { store, client, deps } = makeDeps();
    store.upsertOrder({ orderId: 'o1', serviceId: 'svc-schema', status: 'paid' }); // paid, delivered=0
    (client.getOrder as any).mockResolvedValue({
      orderId: 'o1',
      serviceId: 'svc-schema',
      negotiationId: 'neg1',
      status: 'paid',
    });
    await reconcileOrders(deps);
    expect(client.deliverOrder).toHaveBeenCalledOnce(); // re-delivered
    expect(store.isDelivered('o1')).toBe(true);
  });

  it('skips re-processing an already-delivered order', async () => {
    const { stream, client, store, deps } = makeDeps();
    store.upsertOrder({ orderId: 'o1', status: 'paid' });
    store.markDelivered('o1');
    await startProvider(deps);
    await stream.emit(EventType.OrderPaid, { order_id: 'o1', service_id: 'svc-schema' });
    expect(client.deliverOrder).not.toHaveBeenCalled();
  });
});
