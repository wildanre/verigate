'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Reveal } from './Reveal';
import { CountUp } from './CountUp';
import { DotGrid } from './DotGrid';
import { Particles } from './Particles';

const GH = 'https://github.com/wildanre/verigate';
const API_BASE = 'https://api-verigate.staifdev.codes';

export interface LandingMetrics {
  total: number;
  completed: number;
  uniqueCounterparties: number;
}

const SERVICES = [
  { name: 'Schema & Output Validation', price: '0.015', desc: 'Deterministic JSON Schema validation of any AI output.' },
  { name: 'Hallucination / Grounding', price: '0.02', desc: 'Scores how well generated text is supported by its source.' },
  { name: 'Fact-Check with Sources', price: '0.05', desc: 'Checks claims against the live web and returns source URLs.' },
];

const STEPS = [
  { t: 'Negotiate & pay', d: 'A requester agent hires a service; USDC is locked in a CAP escrow.' },
  { t: 'Verify', d: 'VeriGate runs the check — schema, grounding, or fact-check.' },
  { t: 'Deliver on-chain', d: 'The report is delivered, its hash written on Base, and the escrow settles.' },
];

const COMPARE = [
  ['Proof', 'On-chain report hash', 'None — trust the vendor'],
  ['Access', 'Autonomous agent-to-agent, no signup', 'API key + account'],
  ['Payment', 'Per-call USDC escrow', 'Subscription / prepaid'],
  ['Reputation', 'On-chain, auditable', 'Vendor-claimed'],
];

const FAQ = [
  ['Do I need crypto?', 'To hire over CAP, yes — a little USDC on Base. To try it, no: use the free playground or /api/try.'],
  ['What does it cost?', '0.015–0.05 USDC per verification, depending on the service. No subscription.'],
  ['Is it open source?', 'Yes — MIT licensed, code and docs on GitHub.'],
  ['What happens to my data?', 'Verification runs per request; only the report hash is written on-chain, not your content.'],
  ['How do I verify a report?', 'Every result carries a report hash and a Basescan delivery tx — open its order page to check.'],
];

const MCP_SNIPPET = `{
  "mcpServers": {
    "verigate": {
      "command": "node",
      "args": ["/path/to/verigate/dist/mcp-server.js"],
      "env": { "CROO_SDK_KEY": "croo_sk_...requester..." }
    }
  }
}`;

const API_SNIPPET = `curl ${API_BASE}/api/try \\
  -H 'content-type: application/json' \\
  -d '{"service":"grounding",
       "source_text":"Base has chain ID 8453.",
       "generated_text":"Base, 8453, by Coinbase 2019."}'`;

const CLI_SNIPPET = `CROO_SDK_KEY=croo_sk_...requester... \\
CROO_TARGET_SERVICE_ID=<service-id> \\
npm run requester`;

export function Landing({ metrics }: { metrics: LandingMetrics }) {
  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <DotGrid />
        <Particles />
        <div className="section-inner hero-inner">
          <span className="pill">● Live on Base mainnet · CROO CAP</span>
          <Headline />
          <p className="hero-sub">
            Verification-as-a-Service for AI outputs — fact-checking, schema validation, and hallucination detection.
            Paid per verification in USDC, every result hashed on-chain.
          </p>
          <div className="cta-row">
            <a className="btn" href="/playground">Try it free</a>
            <a className="btn ghost" href="#get-started">Add to Claude / Cursor</a>
          </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="band">
        <div className="section-inner stat-row">
          <Stat value={metrics.total} label="Orders" />
          <Stat value={metrics.completed} label="Completed" />
          <Stat value={metrics.uniqueCounterparties} label="Counterparties" />
          <Stat value={metrics.completed} label="On-chain proofs" />
        </div>
      </section>

      {/* Services */}
      <Section id="services" title="Three verification services" kicker="What it does">
        <div className="grid-3">
          {SERVICES.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.08} className="card">
              <div className="price">{s.price} USDC</div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" title="How it works" kicker="CAP flow">
        <div className="flow">
          {STEPS.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.1} className="flow-step">
              <div className="flow-num">{i + 1}</div>
              <h4>{s.t}</h4>
              <p>{s.d}</p>
              {i < STEPS.length - 1 && <span className="flow-arrow" aria-hidden>→</span>}
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Get started */}
      <Section id="get-started" title="Get started" kicker="Use it three ways">
        <div className="grid-3">
          <Reveal className="card code-card">
            <h3>Hire via MCP</h3>
            <p>Add VeriGate to Claude Desktop or Cursor.</p>
            <pre>{MCP_SNIPPET}</pre>
            <a className="link" href={`${GH}/blob/main/docs/MCP.md`} target="_blank" rel="noreferrer">MCP docs →</a>
          </Reveal>
          <Reveal delay={0.08} className="card code-card">
            <h3>Free API preview</h3>
            <p>Run any service, no payment.</p>
            <pre>{API_SNIPPET}</pre>
            <a className="link" href="/playground">Open playground →</a>
          </Reveal>
          <Reveal delay={0.16} className="card code-card">
            <h3>Hire over CAP</h3>
            <p>Settle a real on-chain order.</p>
            <pre>{CLI_SNIPPET}</pre>
            <a className="link" href={`${GH}/blob/main/docs/USAGE.md`} target="_blank" rel="noreferrer">Usage guide →</a>
          </Reveal>
        </div>
      </Section>

      {/* Why CAP + comparison */}
      <Section id="why" title="Why CAP, not a normal API" kicker="The difference">
        <Reveal className="table-wrap">
          <table className="compare">
            <thead>
              <tr><th></th><th>VeriGate (CAP)</th><th>Normal API</th></tr>
            </thead>
            <tbody>
              {COMPARE.map((row) => (
                <tr key={row[0]}>
                  <th>{row[0]}</th>
                  <td className="good">{row[1]}</td>
                  <td className="muted-cell">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="FAQ" kicker="Good to know">
        <div className="faq">
          {FAQ.map((f, i) => (
            <Reveal key={f[0]} delay={i * 0.05} className="faq-item">
              <h4>{f[0]}</h4>
              <p>{f[1]}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Proof */}
      <Section id="proof" title="Proven on Base mainnet" kicker="Real orders">
        <Reveal className="proof">
          <p>Real completed orders, hashes written on-chain:</p>
          <ul>
            <li>
              Schema (fail) —{' '}
              <a href="https://basescan.org/tx/0x1529d1ba21db73cf7a43d4231cd4bc70b3209eb4fb34665dd49db124ce13b601" target="_blank" rel="noreferrer">delivery tx ↗</a>
            </li>
            <li>
              Fact-check (pass) —{' '}
              <a href="https://basescan.org/tx/0xe1095cb074279665d3429adb7d2654ec77caa1028e4319f708d8742fdc2ffb17" target="_blank" rel="noreferrer">payment tx ↗</a>
            </li>
            <li>
              <a href="/dashboard">See the live dashboard →</a>
            </li>
          </ul>
        </Reveal>
      </Section>

      {/* Footer */}
      <footer className="footer">
        <div className="section-inner footer-inner">
          <div>
            <strong>🛡️ VeriGate</strong>
            <p className="muted">Verification-as-a-Service on CROO CAP.</p>
          </div>
          <nav className="footer-links">
            <a href="/dashboard">Dashboard</a>
            <a href="/playground">Playground</a>
            <a href={`${GH}/blob/main/docs/USAGE.md`} target="_blank" rel="noreferrer">Usage</a>
            <a href={`${GH}/blob/main/docs/MCP.md`} target="_blank" rel="noreferrer">MCP</a>
            <a href={GH} target="_blank" rel="noreferrer">GitHub</a>
          </nav>
          <span className="muted">MIT · verigate.staifdev.codes</span>
        </div>
      </footer>
    </div>
  );
}

function Headline() {
  const reduced = useReducedMotion();
  const words = 'Hire an agent to check your agent'.split(' ');
  if (reduced) return <h1 className="hero-title">Hire an agent to check your agent</h1>;
  return (
    <h1 className="hero-title">
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {w}
        </motion.span>
      ))}
    </h1>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat-value">
        <CountUp value={value} />
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker: string; children: ReactNode }) {
  return (
    <section id={id} className="sec">
      <div className="section-inner">
        <Reveal>
          <div className="kicker">{kicker}</div>
          <h2 className="sec-title">{title}</h2>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
