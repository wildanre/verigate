import { describe, it, expect, vi } from 'vitest';
import { EventType, InsufficientBalanceError } from '@croo-network/sdk';
import { attachRequester, type RequesterClient } from './requester.js';
import type { StreamLike } from '../src/provider.js';

class FakeStream implements StreamLike {
  private handlers = new Map<string, (e: any) => any>();
  closed = false;
  on(type: string, h: (e: any) => any) {
    this.handlers.set(type, h);
  }
  close() {
    this.closed = true;
  }
  async emit(type: string, e: any) {
    return await this.handlers.get(type)?.(e);
  }
}

function makeClient(overrides: Partial<RequesterClient> = {}): RequesterClient {
  return {
    connectWebSocket: async () => new FakeStream(),
    negotiateOrder: vi.fn(async () => ({ negotiationId: 'n1' })),
    payOrder: vi.fn(async () => ({ txHash: '0xpay' })),
    getDelivery: vi.fn(async () => ({ deliverableSchema: '{"verdict":"pass"}', contentHash: '0xhash' })),
    ...overrides,
  };
}

describe('attachRequester', () => {
  it('pays on order_created and resolves with the delivery on completion', async () => {
    const stream = new FakeStream();
    const client = makeClient();
    const p = attachRequester(stream, client, { serviceId: 'svc' });

    await stream.emit(EventType.OrderCreated, { order_id: 'o1' });
    await stream.emit(EventType.OrderCompleted, { order_id: 'o1' });

    const delivery = await p;
    expect(client.payOrder).toHaveBeenCalledWith('o1');
    expect(delivery.deliverableSchema).toBe('{"verdict":"pass"}');
    expect(stream.closed).toBe(true);
  });

  it('pays only once even if order_created fires twice', async () => {
    const stream = new FakeStream();
    const client = makeClient();
    const p = attachRequester(stream, client, { serviceId: 'svc' });

    await stream.emit(EventType.OrderCreated, { order_id: 'o1' });
    await stream.emit(EventType.OrderCreated, { order_id: 'o1' });
    await stream.emit(EventType.OrderCompleted, { order_id: 'o1' });

    await p;
    expect(client.payOrder).toHaveBeenCalledOnce();
  });

  it('surfaces an actionable message on insufficient balance', async () => {
    const stream = new FakeStream();
    const client = makeClient({
      payOrder: vi.fn(async () => {
        throw new InsufficientBalanceError('USDC', 15000n, 0n);
      }),
    });
    const p = attachRequester(stream, client, { serviceId: 'svc' });
    await stream.emit(EventType.OrderCreated, { order_id: 'o1' });
    await expect(p).rejects.toThrow(/AA Wallet Address/);
  });

  it('rejects when the order is rejected', async () => {
    const stream = new FakeStream();
    const p = attachRequester(stream, makeClient(), { serviceId: 'svc' });
    await stream.emit(EventType.OrderRejected, { order_id: 'o1', reason: 'engine failure' });
    await expect(p).rejects.toThrow(/rejected/);
  });
});
