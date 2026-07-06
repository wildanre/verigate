'use client';

import { useState } from 'react';

const SAMPLES: Record<string, string> = {
  schema: JSON.stringify(
    { output: { name: 'Ada' }, expected_schema: { type: 'object', required: ['name', 'age'] } },
    null,
    2,
  ),
  grounding: JSON.stringify(
    {
      source_text: 'Base is an Ethereum L2 with chain ID 8453.',
      generated_text: 'Base is an L2 with chain ID 8453, launched by Coinbase in 2019.',
    },
    null,
    2,
  ),
  factcheck: JSON.stringify({ claims: ['Base has chain ID 8453', 'Ethereum was created in 2009'] }, null, 2),
};

export default function PlaygroundPage() {
  const [service, setService] = useState('schema');
  const [input, setInput] = useState(SAMPLES.schema);
  const [result, setResult] = useState<string>('');
  const [busy, setBusy] = useState(false);

  function onServiceChange(next: string) {
    setService(next);
    setInput(SAMPLES[next] ?? '');
    setResult('');
  }

  async function run() {
    setBusy(true);
    setResult('');
    try {
      const parsed = JSON.parse(input);
      const resp = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, ...parsed }),
      });
      setResult(JSON.stringify(await resp.json(), null, 2));
    } catch (e) {
      setResult(`Error: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container">
      <header className="page-head">
        <div className="kicker">Free preview</div>
        <h1 className="page-title">Playground</h1>
        <p className="page-sub">
          Run any of the three services live against the provider engine — no payment, no signup. To settle a real
          on-chain order, hire VeriGate over CAP with the MCP server or the CLI requester.
        </p>
      </header>

      <div className="pg-grid">
        <div className="pg-panel">
          <label htmlFor="service">Service</label>
          <select id="service" value={service} onChange={(e) => onServiceChange(e.target.value)}>
            <option value="schema">Schema &amp; output validation</option>
            <option value="grounding">Hallucination / grounding check</option>
            <option value="factcheck">Fact-check with sources</option>
          </select>

          <label htmlFor="input">Requirements (JSON)</label>
          <textarea id="input" rows={14} value={input} onChange={(e) => setInput(e.target.value)} />

          <button onClick={run} disabled={busy}>
            {busy ? 'Running…' : 'Run verification'}
          </button>
        </div>

        <div className="pg-result">
          <p className="pg-result-head">Report</p>
          {result ? (
            <pre>{result}</pre>
          ) : (
            <div className="empty">{busy ? 'Verifying…' : 'Run a verification to see the JSON report.'}</div>
          )}
        </div>
      </div>
    </section>
  );
}
