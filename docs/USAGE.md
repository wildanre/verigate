# VeriGate — Usage Guide

Two audiences: **consumers** who hire VeriGate to verify outputs, and **operators** who run their own VeriGate provider.

---

## Part 1 — Consumers: hire VeriGate

### Option A — Free preview (no crypto)

Run any service directly against the deployed engine — no order, no payment.

- **Playground UI:** https://verigate.staifdev.codes/playground
- **HTTP API:** `POST https://api-verigate.staifdev.codes/api/try`

```bash
# Schema validation
curl -s https://api-verigate.staifdev.codes/api/try -H 'content-type: application/json' \
  -d '{"service":"schema","output":{"name":"Ada"},"expected_schema":{"type":"object","required":["name","age"]}}'

# Grounding / hallucination
curl -s https://api-verigate.staifdev.codes/api/try -H 'content-type: application/json' \
  -d '{"service":"grounding","source_text":"Base has chain ID 8453.","generated_text":"Base, chain ID 8453, launched by Coinbase in 2019."}'

# Fact-check
curl -s https://api-verigate.staifdev.codes/api/try -H 'content-type: application/json' \
  -d '{"service":"factcheck","claims":["Base has chain ID 8453"]}'
```

The preview proves the value; it does **not** produce an on-chain proof. For that, hire over CAP (Option B or C).

### Option B — Hire via MCP

Add the VeriGate MCP server to Claude Desktop / Cursor and let your agent verify things over CAP. See **[MCP.md](MCP.md)**.

### Option C — Hire over CAP with the SDK requester

You need a **CROO requester agent** (a second agent you own) with a little **USDC in its AA wallet**.

```bash
git clone https://github.com/wildanre/verigate.git && cd verigate && npm install && npm run build

CROO_SDK_KEY="croo_sk_...your-requester-agent..." \
CROO_TARGET_SERVICE_ID="217e16a8-4180-44af-bfa3-cf870c8fd6a8" \
REQUIREMENTS='{"output":{"name":"Ada"},"expected_schema":{"type":"object","required":["name","age"]}}' \
npm run requester
```

It negotiates → pays → waits for delivery → prints the report. Deployed VeriGate service IDs:

| Service | ID |
|---|---|
| Schema & Output Validation | `217e16a8-4180-44af-bfa3-cf870c8fd6a8` |
| Hallucination / Grounding | `d99ee10c-8ed6-4781-96e3-914e0eb9e8a5` |
| Fact-Check with Sources | `8f88db1e-cd86-4487-95a9-f7829c02bf29` |

### Report format

```jsonc
{
  "verdict": "pass | fail | partial",
  "score": 90,
  // schema: "violations", "suggestions"
  // grounding: "grounding_score", "unsupported_sentences"
  // fact-check: "checks": [{ "claim", "result", "confidence", "sources": [...] }]
  "verified_by": "VeriGate v1.0",
  "timestamp": "2026-07-05T12:52:01.411Z",
  "report_hash": "0x…"   // also written on-chain as the CAP delivery proof
}
```

---

## Part 2 — Operators: run your own VeriGate

### Prerequisites

1. A **CROO account** with an agent registered at [agent.croo.network](https://agent.croo.network). Register the **three services** (Schema, Grounding, Fact-Check) with `Schema` requirements/deliverables. Note each service ID.
2. A little **USDC in the agent's AA wallet** — CROO uses an ERC-20 (USDC) paymaster, so the provider wallet needs a small USDC balance to sponsor gas for `createOrder`/`deliverOrder`. No ETH needed.
3. An **Anthropic-compatible LLM key** (direct Anthropic key or a gateway like Manifest) and a **Tavily key** for fact-check.

### Environment

Copy `.env.example` → `.env` and fill in:

```bash
CROO_API_URL=https://api.croo.network
CROO_WS_URL=wss://api.croo.network/ws
CROO_SDK_KEY=croo_sk_...your-provider...
SVC_FACTCHECK_ID=...
SVC_SCHEMA_ID=...
SVC_GROUNDING_ID=...
# LLM: direct Anthropic key…
ANTHROPIC_API_KEY=sk-ant-...
# …or an Anthropic-compatible gateway (bearer token):
# ANTHROPIC_AUTH_TOKEN=mnfst__...
# ANTHROPIC_BASE_URL=https://app.manifest.build
# ANTHROPIC_MODEL=auto
TAVILY_API_KEY=tvly-...
DB_PATH=./data/verigate.db
PORT=8080
```

### Run locally

```bash
npm install && npm run build
node --env-file=.env dist/main.js     # provider goes online + serves :8080
```

### Deploy the provider (Docker — Tencent Cloud or any host)

```bash
docker build -t verigate .
docker run -d --restart unless-stopped --name verigate \
  --env-file .env -p 8080:8080 -v verigate-data:/app/data verigate
```

- Set env vars on the host; **never** bake `.env` into the image (values may be unquoted — config strips surrounding quotes so Docker `--env-file` works too).
- Mount a volume at `/app/data` so the order store persists across restarts.
- **Open inbound TCP 8080** in your cloud firewall / security group so the dashboard can reach the API.
- Health check: `GET /health`.

### Deploy the dashboard (Vercel)

Import the repo, set **Root Directory = `web`**, and add env `PROVIDER_API_URL=http://<provider-host>:8080`. The dashboard reads the provider API — no database on Vercel.

### Operational notes

- **One WebSocket per SDK-Key.** The provider is the sole holder of the VeriGate key's socket. Requesters use a different agent's key.
- **Idempotent delivery.** Delivered order IDs are recorded; a replayed `order_paid` is skipped. Transient failures retry; permanent ones (bad input, unknown service) reject and refund.
- **Reconciliation.** A 30s loop re-syncs in-flight order statuses from CROO in case an `order_completed` event is missed.
- **`/api/try` cost.** The free preview runs the LLM/search on the operator's keys. Input is size-capped; add auth or rate limiting before heavy public exposure.
