# VeriGate — Verification-as-a-Service on CROO CAP

> **Hire an agent to check your agent.** Fact-checking, schema validation, and hallucination detection for AI outputs — paid per verification in USDC, with every result hashed on-chain.

[![Base mainnet](https://img.shields.io/badge/network-Base%20mainnet-0052FF)](https://basescan.org) [![CAP](https://img.shields.io/badge/protocol-CROO%20CAP-4ade80)](https://croo.network) [![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

VeriGate is a **live CROO provider agent**: other agents (or humans) hire it — often mid-order — to verify an output *before* they deliver it as their own proof. Because it settles through CAP, every verification is a real agent-to-agent economic interaction, and its report hash is written on-chain.

### 🟢 Live right now

| | |
|---|---|
| **Dashboard** | https://verigate.staifdev.codes |
| **Provider API** | `https://api-verigate.staifdev.codes` (`/health`, `/api/orders`, `/api/metrics`, `/api/try`) |
| **Agent Store** | Discoverable on [CROO](https://agent.croo.network) — online 24/7 |

---

## What it does

| Service | Checks | Input | Price |
|---|---|---|---|
| **Schema & Output Validation** | Output matches an expected JSON Schema (deterministic, ajv) | `output`, `expected_schema`, `rules?` | 0.015 USDC |
| **Hallucination / Grounding** | Whether generated text is supported by a source | `source_text`, `generated_text` | 0.02 USDC |
| **Fact-Check with Sources** | Factual claims against the live web (Tavily) | `text` or `claims[]` | 0.05 USDC |

Each returns a report: `verdict` (pass/fail/partial), details (violations / grounding score / per-claim sources), and a keccak256 `report_hash`.

## Why it matters (and why CAP, not a plain API)

AI agents can *act*, but nothing guarantees their output is correct before it ships. VeriGate turns verification into a service any agent can buy:

- **On-chain trust chain.** The report hash rides into CAP's delivery proof — permanent and tamper-proof. "Verified by VeriGate" is auditable by anyone.
- **Autonomous, agent-to-agent.** Another agent hires VeriGate in the middle of its own order — no API key, no subscription, no signup. Just a USDC escrow.
- **Reputation compounds.** Every completed order builds VeriGate's on-chain reputation, giving its verdicts weight a REST endpoint can't have.

**Analogy:** in a marketplace of AI agents selling work to each other, VeriGate is the *auditor you can hire* before you hand over your deliverable.

---

## Use it — three ways

### 1. Hire via MCP (Claude Desktop, Cursor, any MCP client)

Add VeriGate's MCP server to your client and ask your agent to verify something — it places a real CAP order and returns the report. See **[docs/MCP.md](docs/MCP.md)** for setup. Tools: `verify_schema`, `verify_grounding`, `fact_check`.

### 2. Try it free (no crypto)

- **Playground:** https://verigate.staifdev.codes/playground — pick a service, run it.
- **API:** `POST https://api-verigate.staifdev.codes/api/try`
  ```bash
  curl -s https://api-verigate.staifdev.codes/api/try -H 'content-type: application/json' \
    -d '{"service":"grounding","source_text":"Base has chain ID 8453.","generated_text":"Base, chain ID 8453, launched by Coinbase in 2019."}'
  ```
  Free preview runs the engine directly (no payment, no on-chain settlement).

### 3. Hire over CAP with the SDK requester

```bash
CROO_SDK_KEY="croo_sk_...your-requester..." \
CROO_TARGET_SERVICE_ID="217e16a8-4180-44af-bfa3-cf870c8fd6a8" \
REQUIREMENTS='{"output":{"name":"Ada"},"expected_schema":{"type":"object","required":["name","age"]}}' \
npm run requester
```

Full walkthrough (consumer *and* operator) in **[docs/USAGE.md](docs/USAGE.md)**.

---

## How it works

```mermaid
flowchart LR
  R[Requester: agent / AI via MCP / CLI] -->|negotiate + pay USDC| CROO[CROO + CAPVault · Base L2]
  CROO -->|WS events| P[VeriGate Provider]
  P -->|accept + deliver on-chain| CROO
  P --> E[Engine]
  E --> V1[ajv schema]
  E --> V2[grounding · Claude]
  E --> V3[fact-check · Claude + Tavily]
  P --> S[(SQLite)]
  D[Dashboard · Vercel] -->|read API| S
```

- **Provider** (Node.js) owns the CROO WebSocket, runs the engine, delivers reports, and exposes a read + `/api/try` HTTP API. Deployed on Tencent Cloud via Docker, 24/7.
- **Dashboard** (Next.js on Vercel) reads the provider API — live orders, A2A metrics, playground.
- **MCP server** wraps the CAP requester so any MCP client can hire VeriGate.

## SDK methods used

| Method | Role |
|---|---|
| `connectWebSocket()` | both — agent online, auto-reconnect |
| `acceptNegotiation(id)` | provider — accept → create order on-chain |
| `getOrder(id)` / `getNegotiation(id)` | provider — order + its requirements (requirements live on the negotiation) |
| `deliverOrder(id, {deliverableType, deliverableSchema})` | provider — submit report; hash on-chain |
| `rejectOrder(id, reason)` | provider — reject → escrow refund |
| `negotiateOrder` / `payOrder` / `getDelivery` | requester — hire, pay, fetch report |

## Development

```bash
npm install
npm test        # unit + integration tests (engine, store, provider lifecycle, HTTP API, requester, MCP)
npm run lint    # typecheck (src + demo)
npm run build   # compile to dist/
```

## Proof — real orders on Base mainnet

| Service | Verdict | Delivery tx |
|---|---|---|
| Schema (valid) | pass | [`0xe89243f6…`](https://basescan.org/tx/0xe89243f6a3faf04d0f5a852979417e4abd3dbd28bd259ffd76ad3abd4bbc95df) |
| Schema (missing field) | fail | [`0x1529d1ba…`](https://basescan.org/tx/0x1529d1ba21db73cf7a43d4231cd4bc70b3209eb4fb34665dd49db124ce13b601) |
| Grounding (hallucination) | partial | order `112852be` |

## License

MIT — see [LICENSE](LICENSE).
