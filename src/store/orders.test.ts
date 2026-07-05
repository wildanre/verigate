import { describe, it, expect } from 'vitest';
import { OrderStore } from './orders.js';

function store() {
  return new OrderStore(':memory:');
}

describe('OrderStore', () => {
  it('upserts then reads back an order', () => {
    const s = store();
    s.upsertOrder({ orderId: 'o1', serviceId: 'svc', status: 'paid', requesterAgentId: 'a1' });
    const row = s.getOrder('o1');
    expect(row?.status).toBe('paid');
    expect(row?.serviceId).toBe('svc');
  });

  it('merges on repeat upsert without duplicating or clobbering fields', () => {
    const s = store();
    s.upsertOrder({ orderId: 'o1', serviceId: 'svc', status: 'created', requesterAgentId: 'a1' });
    s.upsertOrder({ orderId: 'o1', status: 'paid' }); // serviceId omitted -> preserved
    const row = s.getOrder('o1');
    expect(row?.status).toBe('paid');
    expect(row?.serviceId).toBe('svc');
    expect(s.listOrders()).toHaveLength(1);
  });

  it('records a report and marks the order delivered', () => {
    const s = store();
    s.upsertOrder({ orderId: 'o1', status: 'paid' });
    expect(s.isDelivered('o1')).toBe(false);
    s.recordReport('o1', { verdict: 'pass' }, '0xdeadbeef');
    expect(s.isDelivered('o1')).toBe(true);
    const row = s.getOrder('o1');
    expect(row?.report).toEqual({ verdict: 'pass' });
    expect(row?.deliverTxHash).toBe('0xdeadbeef');
  });

  it('computes distinct counterparty and buyer metrics', () => {
    const s = store();
    s.upsertOrder({ orderId: 'o1', status: 'completed', requesterAgentId: 'a1', buyerWalletAddress: 'w1' });
    s.upsertOrder({ orderId: 'o2', status: 'completed', requesterAgentId: 'a1', buyerWalletAddress: 'w2' });
    s.upsertOrder({ orderId: 'o3', status: 'paid', requesterAgentId: 'a2', buyerWalletAddress: 'w2' });
    const m = s.metrics();
    expect(m.completed).toBe(2);
    expect(m.uniqueCounterparties).toBe(2); // a1, a2
    expect(m.uniqueBuyers).toBe(2); // w1, w2
    expect(m.total).toBe(3);
  });

  it('returns null for a missing order', () => {
    expect(store().getOrder('nope')).toBeNull();
  });

  it('appends events without error', () => {
    const s = store();
    s.appendEvent('order_paid', 'o1', { order_id: 'o1' });
    s.appendEvent('order_completed', 'o1', null);
    expect(s.getOrder('o1')).toBeNull(); // events don't create orders
  });
});
