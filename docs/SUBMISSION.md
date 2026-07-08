# VeriGate — CROO Hackathon Submission Goal

**Goal:** File a complete, reward-eligible BUIDL for VeriGate on DoraHacks before the deadline.
**Tracks (max 2):** Data & Verification Agents (primary) · Developer Tooling Agents (secondary).
**Status as of 2026-07-08:** live numbers pulled from `https://api-verigate.staifdev.codes/api/metrics`.

---

## Track fit

- **Data & Verification Agents** — VeriGate *is* a verification agent: schema/output checks, grounding, fact-check with sources; every result hashed on-chain.
- **Developer Tooling Agents** — VeriGate ships tools *for other CAP builders*: an MCP server (`verify_schema` / `verify_grounding` / `fact_check`), a free `/api/try` preview, and an SDK requester others can copy.

## Submission checklist

| # | Requirement | Status | Evidence / note |
|---|---|---|---|
| 1 | **Build** — agent in any framework, data + execution sovereign | ✅ | Node.js provider, own engine (ajv + Claude via Manifest + Tavily), self-hosted on Tencent. |
| 2 | **Integrate CAP** — callable, accepts USDC, settles on-chain | ✅ | 56 completed orders on Base mainnet; negotiate → pay → deliver → settle, report hash on-chain. |
| 3 | **List** — on CROO Agent Store | ✅ | Registered, online 24/7 (3 services). |
| 4 | **Open-source** — public repo, permissive license | ✅ | `github.com/wildanre/verigate`, MIT. |
| 5 | **Demo** — max 5-min video | 🟡 | Assets recorded (`demo-video/`, script, deck). **Final narrated ≤5-min video not yet published.** |
| 6 | **Submit** — file BUIDL on DoraHacks before deadline | 🔴 | **Not filed yet.** All fields + links needed. |

## Reward-eligibility (anti-sybil) — all thresholds MET

| Flag (reviewed, not auto-DQ) | Threshold | VeriGate | Status |
|---|---|---|---|
| Unique counterparty agents | ≥ 3 | **8** | ✅ |
| Unique buyer wallets | ≥ 5 | **8** | ✅ |
| Concentrated self-trade pattern | avoid | orders span 8 distinct counterparties | ✅ low risk |
| Random 10% human audit | pass | every order reproducible from the public repo | ✅ ready |

**Technical-execution bonus** ("10+ real CAP orders during the hackathon"): **56 completed** — far exceeded.

## Hard-disqualification checks (all clear)

- Private repo / unverifiable code → repo is public MIT. ✅
- Copy-paste fork without modification → original build. ✅
- Fake demo / broken CAP integration / failed spot-check → real on-chain orders, reproducible. ✅

## Eligibility

- Open globally, team size 1–5. ✅ (confirm team size + builder age 18+ / guardian consent if 13–17.)

## Remaining actions (deadline-critical)

1. **Record + publish the ≤5-min demo video** (YouTube unlisted ok). Use `docs/DEMO-SCRIPT.md` + `demo-video/` capture + `demo-video/deck.html` intro.
2. **File the BUIDL on DoraHacks** — title, tagline, description, both tracks, repo link, demo video link, Agent Store listing link, and order proof (dashboard + Basescan tx).
3. Fill every required DoraHacks field; submit before the deadline (buffer, not last-minute).

## Known minor issue (not blocking submission)

- CROO Store order form (V2) shows "not yet supported in V2" for the Schema service's `object`/`array` fields — that's a CROO UI limitation, not a VeriGate bug. Ordering works programmatically (SDK / MCP / `/api/try`). Optional fix: re-register those fields as `string` and parse JSON server-side.
