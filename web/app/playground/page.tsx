'use client';

import { useState } from 'react';

const SAMPLE = JSON.stringify(
  { output: { name: 'Ada', age: 36 }, expected_schema: { type: 'object', required: ['name', 'age'] } },
  null,
  2,
);

export default function PlaygroundPage() {
  const [service, setService] = useState('schema');
  const [input, setInput] = useState(SAMPLE);
  const [result, setResult] = useState<string>('');
  const [busy, setBusy] = useState(false);

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
    <section>
      <h2>Playground</h2>
      <p className="label">
        Try a service. Schema validation runs live; grounding and fact-check need a paid CAP order (use the demo
        requester).
      </p>

      <label htmlFor="service">Service</label>
      <select id="service" value={service} onChange={(e) => setService(e.target.value)}>
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
