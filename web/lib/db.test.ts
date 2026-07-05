import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rmSync } from 'node:fs';
import { getOrders, getMetrics } from './db.js';

const path = join(tmpdir(), `verigate-dash-${Date.now()}.db`);

beforeAll(() => {
  const db = new Database(path);
  db.exec(`CREATE TABLE orders (
    orderId TEXT PRIMARY KEY, serviceId TEXT, requesterAgentId TEXT, buyerWalletAddress TEXT,
    status TEXT, price TEXT, report TEXT, deliverTxHash TEXT, delivered INTEGER DEFAULT 0,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`);
  const now = new Date().toISOString();
  const ins = db.prepare(
    `INSERT INTO orders (orderId, serviceId, requesterAgentId, buyerWalletAddress, status, report, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  ins.run('o1', 'svc-schema', 'a1', 'w1', 'completed', '{"verdict":"pass"}', now, now);
  ins.run('o2', 'svc-grounding', 'a2', 'w2', 'paid', null, now, now);
  db.close();
});

afterAll(() => rmSync(path, { force: true }));

describe('dashboard db read layer', () => {
  it('reads orders and parses the report JSON', () => {
    const orders = getOrders(path);
    expect(orders).toHaveLength(2);
    expect(orders.find((o) => o.orderId === 'o1')?.report).toEqual({ verdict: 'pass' });
  });

  it('computes A2A metrics', () => {
    const m = getMetrics(path);
    expect(m.completed).toBe(1);
    expect(m.uniqueCounterparties).toBe(2);
    expect(m.uniqueBuyers).toBe(2);
    expect(m.total).toBe(2);
  });

  it('returns empty/zero when the database is absent', () => {
    expect(getOrders('/no/such/path.db')).toEqual([]);
    expect(getMetrics('/no/such/path.db')).toEqual({ completed: 0, uniqueCounterparties: 0, uniqueBuyers: 0, total: 0 });
  });
});
