import Database from 'better-sqlite3';
import { existsSync } from 'node:fs';

/** Default points at the provider's SQLite file (co-located deployment). */
export const DEFAULT_DB_PATH = process.env.DB_PATH ?? '../data/verigate.db';

export interface DashOrder {
  orderId: string;
  serviceId: string | null;
  requesterAgentId: string | null;
  buyerWalletAddress: string | null;
  status: string | null;
  price: string | null;
  report: unknown;
  deliverTxHash: string | null;
  delivered: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashMetrics {
  completed: number;
  uniqueCounterparties: number;
  uniqueBuyers: number;
  total: number;
}

const ZERO: DashMetrics = { completed: 0, uniqueCounterparties: 0, uniqueBuyers: 0, total: 0 };

/** Open the store read-only. Returns null if the file or table isn't there yet. */
function open(path: string): Database.Database | null {
  if (!existsSync(path)) return null;
  try {
    return new Database(path, { readonly: true, fileMustExist: true });
  } catch {
    return null;
  }
}

export function getOrders(path: string = DEFAULT_DB_PATH, limit = 100): DashOrder[] {
  const db = open(path);
  if (!db) return [];
  try {
    const rows = db.prepare('SELECT * FROM orders ORDER BY updatedAt DESC LIMIT ?').all(limit) as (Omit<
      DashOrder,
      'report'
    > & { report: string | null })[];
    return rows.map((r) => ({ ...r, report: r.report ? safeParse(r.report) : null }));
  } catch {
    return [];
  } finally {
    db.close();
  }
}

export function getMetrics(path: string = DEFAULT_DB_PATH): DashMetrics {
  const db = open(path);
  if (!db) return ZERO;
  try {
    return db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM orders WHERE status = 'completed') AS completed,
           (SELECT COUNT(DISTINCT requesterAgentId) FROM orders WHERE requesterAgentId IS NOT NULL) AS uniqueCounterparties,
           (SELECT COUNT(DISTINCT buyerWalletAddress) FROM orders WHERE buyerWalletAddress IS NOT NULL) AS uniqueBuyers,
           (SELECT COUNT(*) FROM orders) AS total`,
      )
      .get() as DashMetrics;
  } catch {
    return ZERO;
  } finally {
    db.close();
  }
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
