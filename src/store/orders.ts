import { openDb, type DB } from './db.js';

export interface OrderInput {
  orderId: string;
  serviceId?: string | null;
  requesterAgentId?: string | null;
  buyerWalletAddress?: string | null;
  status?: string | null;
  price?: string | null;
}

export interface OrderRow {
  orderId: string;
  serviceId: string | null;
  requesterAgentId: string | null;
  buyerWalletAddress: string | null;
  status: string | null;
  price: string | null;
  report: unknown | null;
  deliverTxHash: string | null;
  delivered: number;
  createdAt: string;
  updatedAt: string;
}

export interface Metrics {
  completed: number;
  uniqueCounterparties: number;
  uniqueBuyers: number;
  total: number;
}

/**
 * Persistence for orders and the raw event log. The provider writes here; the
 * dashboard reads the same SQLite file (co-located, read-only accessor).
 */
export class OrderStore {
  private db: DB;

  constructor(pathOrDb: string | DB) {
    this.db = typeof pathOrDb === 'string' ? openDb(pathOrDb) : pathOrDb;
  }

  /** Insert or merge an order; null/undefined fields never overwrite existing values. */
  upsertOrder(o: OrderInput): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO orders (orderId, serviceId, requesterAgentId, buyerWalletAddress, status, price, createdAt, updatedAt)
         VALUES (@orderId, @serviceId, @requesterAgentId, @buyerWalletAddress, @status, @price, @now, @now)
         ON CONFLICT(orderId) DO UPDATE SET
           serviceId          = COALESCE(excluded.serviceId, orders.serviceId),
           requesterAgentId   = COALESCE(excluded.requesterAgentId, orders.requesterAgentId),
           buyerWalletAddress = COALESCE(excluded.buyerWalletAddress, orders.buyerWalletAddress),
           status             = COALESCE(excluded.status, orders.status),
           price              = COALESCE(excluded.price, orders.price),
           updatedAt          = @now`,
      )
      .run({
        orderId: o.orderId,
        serviceId: o.serviceId ?? null,
        requesterAgentId: o.requesterAgentId ?? null,
        buyerWalletAddress: o.buyerWalletAddress ?? null,
        status: o.status ?? null,
        price: o.price ?? null,
        now,
      });
  }

  markStatus(orderId: string, status: string): void {
    this.db
      .prepare(`UPDATE orders SET status = ?, updatedAt = ? WHERE orderId = ?`)
      .run(status, new Date().toISOString(), orderId);
  }

  /** Store the delivered report JSON, tx hash, and flag the order as delivered. */
  recordReport(orderId: string, report: unknown, deliverTxHash?: string): void {
    this.db
      .prepare(
        `UPDATE orders SET report = ?, deliverTxHash = ?, delivered = 1, updatedAt = ? WHERE orderId = ?`,
      )
      .run(JSON.stringify(report), deliverTxHash ?? null, new Date().toISOString(), orderId);
  }

  getOrder(orderId: string): OrderRow | null {
    const row = this.db.prepare(`SELECT * FROM orders WHERE orderId = ?`).get(orderId) as
      | (Omit<OrderRow, 'report'> & { report: string | null })
      | undefined;
    if (!row) return null;
    return { ...row, report: row.report ? JSON.parse(row.report) : null };
  }

  listOrders(limit = 100): OrderRow[] {
    const rows = this.db
      .prepare(`SELECT * FROM orders ORDER BY updatedAt DESC LIMIT ?`)
      .all(limit) as (Omit<OrderRow, 'report'> & { report: string | null })[];
    return rows.map((r) => ({ ...r, report: r.report ? JSON.parse(r.report) : null }));
  }

  metrics(): Metrics {
    return this.db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM orders WHERE delivered = 1 OR status IN ('completed', 'settled')) AS completed,
           (SELECT COUNT(DISTINCT requesterAgentId) FROM orders WHERE requesterAgentId IS NOT NULL) AS uniqueCounterparties,
           (SELECT COUNT(DISTINCT buyerWalletAddress) FROM orders WHERE buyerWalletAddress IS NOT NULL) AS uniqueBuyers,
           (SELECT COUNT(*) FROM orders) AS total`,
      )
      .get() as Metrics;
  }

  isDelivered(orderId: string): boolean {
    const row = this.db.prepare(`SELECT delivered FROM orders WHERE orderId = ?`).get(orderId) as
      | { delivered: number }
      | undefined;
    return row?.delivered === 1;
  }

  markDelivered(orderId: string): void {
    this.db
      .prepare(`UPDATE orders SET delivered = 1, updatedAt = ? WHERE orderId = ?`)
      .run(new Date().toISOString(), orderId);
  }

  appendEvent(type: string, orderId: string | null, raw: unknown): void {
    this.db
      .prepare(`INSERT INTO events (orderId, type, raw, ts) VALUES (?, ?, ?, ?)`)
      .run(orderId, type, raw == null ? null : JSON.stringify(raw), new Date().toISOString());
  }
}
