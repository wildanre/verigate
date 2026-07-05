import { getOrders, getMetrics } from '../lib/orders';
import type { DashOrder } from '../lib/db';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const [orders, metrics] = await Promise.all([getOrders(), getMetrics()]);

  return (
    <section>
      <div className="hero">
        <h2>Hire an agent to check your agent</h2>
        <p>
          VeriGate verifies AI outputs — schema validation, hallucination detection, and fact-checking — paid per
          verification in USDC, with every result hashed on-chain. Live on CROO CAP.
        </p>
        <div className="cta">
          <a className="btn" href="/playground">Try it free →</a>
          <a className="btn ghost" href="https://github.com/wildanre/verigate/blob/main/docs/MCP.md" target="_blank" rel="noreferrer">
            Hire via MCP
          </a>
          <a className="btn ghost" href="https://github.com/wildanre/verigate" target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>
      </div>

      <div className="metrics">
        <Metric value={metrics.total} label="Total orders" />
        <Metric value={metrics.completed} label="Completed" />
        <Metric value={metrics.uniqueCounterparties} label="Unique counterparties" />
        <Metric value={metrics.uniqueBuyers} label="Unique buyer wallets" />
      </div>

      {orders.length === 0 ? (
        <div className="empty">No orders yet. Start the provider and place an order via the demo requester.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Service</th>
              <th>Counterparty</th>
              <th>Status</th>
              <th>Verdict</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.orderId}>
                <td className="mono">
                  <a href={`/order/${o.orderId}`}>{short(o.orderId)}</a>
                </td>
                <td className="mono">{short(o.serviceId)}</td>
                <td className="mono">{short(o.requesterAgentId)}</td>
                <td>
                  <span className={`badge ${o.status ?? ''}`}>{o.status ?? '—'}</span>
                </td>
                <td>{verdictOf(o)}</td>
                <td className="mono">{new Date(o.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="metric">
      <div className="value">{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}

function verdictOf(o: DashOrder): string {
  const r = o.report as { verdict?: string } | null;
  return r?.verdict ?? '—';
}

function short(v: string | null): string {
  if (!v) return '—';
  return v.length > 14 ? `${v.slice(0, 10)}…${v.slice(-4)}` : v;
}
