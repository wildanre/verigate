import { getOrder } from '../../../lib/orders';

export const dynamic = 'force-dynamic';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://verigate.staifdev.codes';

const SERVICE_NAMES: Record<string, string> = {
  '217e16a8-4180-44af-bfa3-cf870c8fd6a8': 'Schema & Output Validation',
  'd99ee10c-8ed6-4781-96e3-914e0eb9e8a5': 'Hallucination / Grounding',
  '8f88db1e-cd86-4487-95a9-f7829c02bf29': 'Fact-Check with Sources',
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) {
    return (
      <section className="container">
        <a className="back-link" href="/dashboard">← Back to dashboard</a>
        <div className="empty">Order not found.</div>
      </section>
    );
  }

  const report = (order.report ?? {}) as Record<string, unknown>;
  const verdict = (report.verdict as string) ?? '—';
  const service = order.serviceId ? SERVICE_NAMES[order.serviceId] ?? order.serviceId : '—';
  const embed = `[![Verified by VeriGate](${SITE}/badge/${verdict})](${SITE}/order/${order.orderId})`;

  return (
    <section className="container">
      <a className="back-link" href="/dashboard">← All orders</a>
      <header className="page-head">
        <div className="kicker">On-chain proof</div>
        <h1 className="page-title">
          Verification {verdict !== '—' && <span className={`badge ${verdict}`}>{verdict}</span>}
        </h1>
      </header>

      <table style={{ marginBottom: 24 }}>
        <tbody>
          <Row label="Order" value={order.orderId} mono />
          <Row label="Service" value={service} />
          <Row label="Status" value={order.status ?? '—'} />
          <Row label="Counterparty" value={order.requesterAgentId ?? '—'} mono />
          <Row label="Report hash" value={(report.report_hash as string) ?? '—'} mono />
          <Row
            label="Delivery tx"
            value={
              order.deliverTxHash ? (
                <a href={`https://basescan.org/tx/${order.deliverTxHash}`} target="_blank" rel="noreferrer">
                  {order.deliverTxHash.slice(0, 18)}… ↗
                </a>
              ) : (
                '—'
              )
            }
            mono
          />
          <Row label="Updated" value={new Date(order.updatedAt).toLocaleString()} />
        </tbody>
      </table>

      <h3>Report</h3>
      <pre>{JSON.stringify(report, null, 2)}</pre>

      <h3>Embed the badge</h3>
      <p className="label">Show a verifiable “Verified by VeriGate” badge that links back to this report:</p>
      <p><img src={`${SITE}/badge/${verdict}`} alt={`Verified by VeriGate: ${verdict}`} /></p>
      <pre>{embed}</pre>
    </section>
  );
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <tr>
      <th style={{ width: 160 }}>{label}</th>
      <td className={mono ? 'mono' : undefined}>{value}</td>
    </tr>
  );
}
