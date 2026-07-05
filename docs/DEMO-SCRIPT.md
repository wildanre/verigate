# VeriGate — Demo Video Script (≤5 min)

Record your voiceover over the Playwright screen-capture (`demo-video/out/*.webm`) or a manual screen recording. Timings are a guide; the visual cues match the recorder in `demo-video/record.mjs`.

**Live URLs:** dashboard `https://verigate.staifdev.codes` · API `https://api-verigate.staifdev.codes` · repo `https://github.com/wildanre/verigate`

---

### 0:00 – 0:30 · Hook + problem
**On screen:** Slide 1 (title), then Slide 2 (problem).

> "AI agents can *do* things — research, write, execute. But nothing guarantees their output is actually *correct* before they hand it off. On CROO, agents pay each other for work and settle on-chain. So the question is: who checks the work? That's VeriGate — an agent you hire to verify another agent's output before it ships."

### 0:30 – 1:00 · What it is
**On screen:** Landing page `verigate.staifdev.codes` — scroll hero → services → live stats.

> "VeriGate is verification-as-a-service on CROO CAP. Three services: schema validation, hallucination and grounding checks, and fact-checking with real web sources. You pay per verification in USDC, and every result's hash is written on-chain. It's live right now — these stats are real orders."

### 1:00 – 1:45 · Try it live (playground)
**On screen:** `/playground` → select *Hallucination / Grounding* → Run → result JSON.

> "Let's try it. I'll take a claim: 'Base is an L2 with chain ID 8453, launched by Coinbase in 2019.' The chain ID is right — but Base launched in 2023, not 2019. Watch VeriGate catch it."
>
> *(result appears)* "Verdict: partial. Grounding score low, and it flags the exact unsupported sentence — the 2019 claim. That's a real hallucination caught, live."

### 1:45 – 2:45 · The real thing: hire over CAP
**On screen:** terminal running the requester (or the recorder's CAP step) — negotiate → pay → deliver.

> "The playground is a free preview. The real product is agent-to-agent commerce. Here a second agent *hires* VeriGate over CAP: it negotiates, pays USDC into escrow, VeriGate runs the check and delivers the report — and the report hash is written to Base. Payment tx… delivery tx… all on-chain."

### 2:45 – 3:30 · Proof on the dashboard
**On screen:** `/dashboard` → orders + metrics → click an order → order page with report + Basescan link + "Verified by VeriGate" badge.

> "Every order shows up on the live dashboard. Open one and you get the full verification report, the on-chain delivery transaction on Basescan, and a shareable 'Verified by VeriGate' badge — so 'verified' actually means something anyone can audit."

### 3:30 – 4:15 · Why CAP, and adoption
**On screen:** Landing → "Why CAP" comparison table → "Get started" (MCP snippet) → Slide (why-CAP).

> "Why does this need CAP instead of a normal API? Three reasons: the proof is on-chain, not vendor-claimed. Any agent can hire it autonomously — no signup, no API key, just an escrow. And its reputation compounds on-chain. And it's usable today: add VeriGate to Claude Desktop or Cursor as an MCP server and hire it in one line."

### 4:15 – 5:00 · Close
**On screen:** Slide (live proof + links).

> "VeriGate is deployed, open-source, and proven on Base mainnet — all three services delivering real orders end-to-end. Try it free at verigate dot staifdev dot codes, or hire it over CAP. Thanks for watching."

---

## Delivery tips
- Speak calmly; let the on-screen action breathe (don't rush the result reveals).
- If your recording runs long, cut the CAP-terminal section (2:45) shortest — the on-chain tx links carry the proof.
- Add subtle background music at low volume; keep the palette-consistent dark UI as the visual anchor.
