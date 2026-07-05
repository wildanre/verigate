# VeriGate — Verification-as-a-Service on CROO CAP

> Hire an agent to check your agent. Fact-checking, schema validation, and hallucination detection for AI agent outputs — paid per verification in USDC, with the result hashed on-chain.

**Base mainnet · CROO CAP · MIT** · Built for the CROO Agent Hackathon 2026 (Track: Data & Verification Agents)

VeriGate is a CROO **provider agent**: other agents hire it, mid-order, to verify an output before they deliver it as their own proof. Because it settles through CAP, every verification is a real agent-to-agent economic interaction and its report hash is written on-chain.

---

## What it does

| Service | Input | Output | Price | SLA |
|---|---|---|---|---|
| **Schema & Output Validation** | `output`, `expected_schema`, `rules?` | verdict + violations + suggestions | 0.015 USDC | 10m |
| **Hallucination / Grounding Check** | `source_text`, `generated_text` | grounding score 0–100 + unsupported sentences | 0.02 USDC | 15m |
| **Fact-Check with Sources** | `text` or `claims[]` | per-claim verdict + source URLs + confidence | 0.05 USDC | 30m |

Schema validation is fully deterministic (ajv). Grounding and fact-check use an LLM (Claude); fact-check also does web search (Tavily) per claim.

## Why CAP (not a plain API)

- **On-chain trust chain.** The report hash rides into CAP's delivery proof — permanent and tamper-proof. "Verified by VeriGate" is auditable by anyone.
- **Autonomous A2A hiring.** Another agent hires VeriGate in the middle of its own order — no API key, no subscription, just a USDC escrow.
- **Reputation compounds.** Completed orders build VeriGate's on-chain reputation, giving its verdicts weight a REST endpoint can't.

## Architecture

```
Requester (agent / AI via CROO MCP)
      │ negotiate, pay (escrow)
      ▼
CROO backend + CAPVault  ──WS events──►  VeriGate Provider ──► Verification Engine
   (Base L2)             ◄─accept, deliver─┘        │           ├─ ajv schema validator
                                                    │           ├─ grounding (Claude)
                                                    ▼           └─ fact-check (Claude + Tavily)
                                            SQLite  ◄── writes orders + reports
                                                    ▲
                                            Dashboard (Next.js) reads (read-only)
```

The **provider** runs on a persistent host (e.g. Tencent Cloud via Docker): it owns the CROO WebSocket, writes orders to SQLite, and exposes a read-only HTTP API (`/health`, `/api/orders`, `/api/metrics`). The **dashboard** deploys separately (e.g. Vercel) and reads that API via `PROVIDER_API_URL`. For local dev the dashboard falls back to reading the SQLite file directly. One CROO API key = one WebSocket, so only the provider holds the socket.

## Quick Start

**Prerequisites:** Node.js 18+, a CROO account with two agents registered ([agent.croo.network](https://agent.croo.network)) — VeriGate (provider) and a second agent (requester) — an Anthropic API key, a Tavily API key, and a little USDC in the requester agent's AA wallet.

```bash
npm install
cp .env.example .env   # fill in CROO_SDK_KEY, the three SVC_*_ID service IDs, ANTHROPIC/TAVILY keys
npm run build
npm run start          # provider goes online (WebSocket)
```

Dashboard (separate process, same `DB_PATH`):

```bash
cd web && npm install && npm run build && npm run start   # http://localhost:3000
```

## Deploy

**Provider** (Docker — e.g. Tencent Cloud):

```bash
docker build -t verigate .
docker run -d --name verigate --env-file .env \
  -p 8080:8080 -v verigate-data:/app/data verigate
```

Set the CROO / LLM / Tavily env vars on the host (never bake `.env` into the image). Mount a volume at `/app/data` so the order store survives restarts. The container exposes the read API on `:8080` with a `/health` check. Keep it running for the whole judging window so VeriGate stays `online` in the Agent Store.

**Dashboard** (Vercel): import the repo, set **Root Directory = `web`**, and add env var `PROVIDER_API_URL=https://<your-provider-host>:8080`. The dashboard reads the provider's API — no database on Vercel.

**Being hired by others:** once the provider is online, any CROO agent can discover and order VeriGate's services (via the Agent Store or the CROO MCP server) — the provider accepts every counterparty for its registered services and settles in USDC.

## Try it (hire VeriGate as an agent)

**Via the CROO MCP server** — add [`mcp/croo.mcp.json`](mcp/croo.mcp.json) to your MCP client (see [`mcp/README.md`](mcp/README.md)) and ask your agent to find and hire a verification agent on CROO.

**Via the SDK requester** (the reliable path):

```bash
CROO_SDK_KEY="croo_sk_...requester..." \
CROO_TARGET_SERVICE_ID="<verigate-service-id>" \
npm run requester
```

It negotiates, pays (sequentially), waits for delivery, and prints the report.

## SDK Methods Used

| Method | Role | Purpose |
|---|---|---|
| `connectWebSocket()` | both | Handshake → agent online; auto-reconnect + heartbeat |
| `acceptNegotiation(id)` | provider | Accept negotiation → create order on-chain |
| `getOrder(id)` | provider | Read the paid order (carries `negotiationId`) |
| `getNegotiation(id)` | provider | Read the order's **requirements** (they live on the negotiation, not the order) |
| `deliverOrder(id, {deliverableType, deliverableSchema})` | provider | Submit the report; hash written on-chain |
| `rejectOrder(id, reason)` | provider | Reject on permanent failure → escrow refunds |
| `negotiateOrder(req)` | requester | Start a negotiation with a service |
| `payOrder(id)` | requester | Pay; auto-approves USDC; locks escrow |
| `getDelivery(id)` | requester | Fetch the delivered report |

## Integration Notes

- **Deliverable shape.** `deliverOrder` takes `{ deliverableType: "schema", deliverableSchema: JSON.stringify(report) }` — a stringified JSON schema deliverable, matching the SDK's `DeliverOrderRequest`.
- **Requirements live on the negotiation.** The CROO `Order` has no `requirements` field; the provider fetches them via `getNegotiation(order.negotiationId)`.
- **Idempotent delivery.** Delivered order IDs are recorded in the store; a replayed `order_paid` (e.g. after reconnect) is skipped. Transient failures retry with backoff; permanent ones (bad input, unknown service) reject.
- **Single WebSocket per key.** The provider is the sole socket holder for VeriGate's key; the requester uses the second agent's key in a separate process.
- **No ETH needed.** Gas is sponsored by the platform.

## Testing

```bash
npm test        # 61 unit + integration tests (engine, store, provider lifecycle, HTTP API, requester, dashboard)
npm run lint    # typecheck (src + demo)
```

The provider lifecycle tests drive a fake event stream through negotiate → pay → deliver, covering the deliver, reject-on-permanent-failure, and retry-without-double-deliver paths with no live network.

## Demo

First real order settled on Base mainnet (order `c47cfc37`, schema validation, verdict `pass`):

- Payment: [`0xccd94040…`](https://basescan.org/tx/0xccd94040e85ee8a09fc7575c7e0706050ffc3df111723f72aedd7824b4564089)
- Delivery (report hash on-chain): [`0xe89243f6…`](https://basescan.org/tx/0xe89243f6a3faf04d0f5a852979417e4abd3dbd28bd259ffd76ad3abd4bbc95df)
- Delivered report hash: `0x4790154f1c0d20f80987eb1b4523d99f2be54f93fb5e7297ffbaa153e762c1f2`

_Demo video link goes here._

## License

MIT — see [LICENSE](LICENSE).
