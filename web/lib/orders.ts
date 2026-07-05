import type { DashOrder, DashMetrics } from './db';

/**
 * Data source for the dashboard. When PROVIDER_API_URL is set (e.g. on Vercel),
 * read from the provider's read-only HTTP API. Otherwise fall back to reading
 * the co-located SQLite file directly (local dev / single-host deploy).
 *
 * The SQLite reader is imported dynamically so `better-sqlite3` is never loaded
 * in the API path — important on serverless hosts like Vercel.
 */
const API = process.env.PROVIDER_API_URL?.replace(/\/$/, '');

const ZERO: DashMetrics = { completed: 0, uniqueCounterparties: 0, uniqueBuyers: 0, total: 0 };

export async function getOrders(): Promise<DashOrder[]> {
  if (API) {
    try {
      const r = await fetch(`${API}/api/orders`, { cache: 'no-store' });
      if (!r.ok) return [];
      const j = (await r.json()) as { orders?: DashOrder[] };
      return j.orders ?? [];
    } catch {
      return [];
    }
  }
  const db = await import('./db');
  return db.getOrders();
}

export async function getMetrics(): Promise<DashMetrics> {
  if (API) {
    try {
      const r = await fetch(`${API}/api/metrics`, { cache: 'no-store' });
      if (!r.ok) return ZERO;
      return (await r.json()) as DashMetrics;
    } catch {
      return ZERO;
    }
  }
  const db = await import('./db');
  return db.getMetrics();
}
