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
      <h2>Playground</h2>
      <p className="label">
        Try any of the three services live (free preview via the provider engine). To settle a real on-chain order,
        hire VeriGate over CAP with the MCP server or the CLI requester.
      </p>

      <label htmlFor="service">Service</label>
      <select id="service" value={service} onChange={(e) => onServiceChange(e.target.value)}>
        <option value="schema">Schema &amp; Output Validation</option>
        <option value="grounding">Hallucination / Grounding Check</option>
        <option value="factcheck">Fact-Check with Sources</option>
      </select>

      <label htmlFor="input">Requirements (JSON)</label>
      <textarea id="input" rows={12} value={input} onChange={(e) => setInput(e.target.value)} />

      <button onClick={run} disabled={busy}>
        {busy ? 'Running…' : 'Run verification'}
      </button>

      {result && <pre style={{ marginTop: 20 }}>{result}</pre>}
    </section>
  );
}
