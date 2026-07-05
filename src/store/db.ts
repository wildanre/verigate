import Database from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

export type DB = Database.Database;

/**
 * Open (creating if needed) the SQLite database at `path` and run migrations.
 * Pass ':memory:' for an ephemeral in-process database (used in tests).
 */
export function openDb(path: string): DB {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  if (path !== ':memory:') db.pragma('journal_mode = WAL');
  migrate(db);
  return db;
}

function migrate(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      orderId            TEXT PRIMARY KEY,
      serviceId          TEXT,
      requesterAgentId   TEXT,
      buyerWalletAddress TEXT,
      status             TEXT,
      price              TEXT,
      report             TEXT,
      deliverTxHash      TEXT,
      delivered          INTEGER NOT NULL DEFAULT 0,
      createdAt          TEXT NOT NULL,
      updatedAt          TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS events (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId TEXT,
      type    TEXT NOT NULL,
      raw     TEXT,
      ts      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_orders_updatedAt ON orders(updatedAt);
    CREATE INDEX IF NOT EXISTS idx_events_orderId ON events(orderId);
  `);
}
