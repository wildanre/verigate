---
title: VeriGate Landing Page - Plan
type: feat
date: 2026-07-05
topic: landing-page
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# VeriGate Landing Page - Plan

## Goal Capsule

- **Objective:** A proper, professional landing page at `/` for the VeriGate dashboard app — value proposition, short usage docs, and live proof — so a first-time visitor understands what VeriGate is and how to use it within the first screen.
- **Product authority:** User.
- **Open blockers:** None.

---

## Product Contract

### Summary

Replace the current orders-table home with a single-scroll landing page at `/` (dashboard moves to `/dashboard`). Dark theme with a single green accent and neutral grays — no gradients, minimal colors, professional. Sections: nav, hero + CTAs, live stats, the three services, short "how to use" docs, why-CAP benefits, on-chain proof, footer. Subtle scroll-reveal and count-up animations (react-bits flavor via framer-motion), kept tasteful.

### Problem Frame

The home route currently shows the operator's order table — the first thing a new visitor sees. That surfaces internal state instead of the value proposition, gives no path to try or integrate, and reads as a tool dashboard rather than a product. A landing page gives visitors a reason to care and a clear next step.

### Key Decisions

- **Dark + single green accent.** Keep the existing theme (`#0b0e14` bg, `#4ade80` accent) plus neutral grays as the only palette. Cohesive with the dashboard and satisfies the no-gradient / minimal-color / professional brief.
- **Landing replaces `/`; dashboard → `/dashboard`.** New visitors see the value prop; operators use `/dashboard`. Playground stays at `/playground`.
- **Animation via `framer-motion`.** Subtle scroll-reveal + count-up for the live stats — the react-bits feel without gradient or heavy WebGL effects.

### Requirements

**Navigation & structure**

- R1. Landing page renders at `/`; the current dashboard (orders + metrics) moves to `/dashboard`; playground stays at `/playground`.
- R2. Sticky top nav: VeriGate logo, in-page section links, a `/dashboard` link, a GitHub link, and one primary CTA. Collapses cleanly on mobile.

**Content sections (single scroll)**

- R3. Hero: headline "Hire an agent to check your agent", one-sentence subhead, two CTAs (Try it free → `/playground`; Docs → GitHub). Subtle text reveal on load; no gradient background.
- R4. Live stats strip: total orders, completed, and unique counterparties (or on-chain proof count) pulled from the provider metrics API, animated with count-up; degrades gracefully to zeros when the API is unreachable.
- R5. Services: three cards — Schema & Output Validation (0.015 USDC), Hallucination / Grounding (0.02), Fact-Check with Sources (0.05) — each with a one-line description.
- R6. How to use (short docs): three blocks — hire via MCP (config snippet), free `/api/try` (curl snippet), CLI/SDK requester — each with a copyable code block and a link to the full docs.
- R7. Why CAP: three benefit points — on-chain verification proof, autonomous agent-to-agent hiring, compounding reputation.
- R8. Proof: a real completed order with Basescan transaction links.
- R9. Footer: links to GitHub, docs (USAGE, MCP), `/dashboard`, `/playground`; MIT; the two live domains.
- R14. How-it-works diagram: a visual flow of the CAP lifecycle — Requester → negotiate & pay (USDC escrow) → VeriGate verifies → delivers report on-chain → settle. Styled in-theme (no gradient).
- R15. MCP quick-connect ("Add to Claude / Cursor"): a prominent block with the copyable `mcp.json` snippet and 1-2-3 steps to hire VeriGate from an MCP client; links to `docs/MCP.md`.
- R16. Comparison: a compact table — VeriGate (CAP) vs a normal API marketplace — across on-chain proof, autonomous agent-to-agent hiring, pay-per-call in USDC, and reputation.
- R17. FAQ: 3-5 concise Q&A (Do I need crypto? What does it cost? Is it open source? What happens to my data? How do I verify a report?).

**Design & behavior**

- R10. Palette is dark background + single green accent + neutral grays only. No gradients anywhere.
- R11. Fully responsive (mobile → desktop) with no overflow or overlap; sensible spacing and typographic hierarchy.
- R12. Moderate animation: scroll-reveal, count-up stats, hover states, an animated-text headline, and a subtle monochrome animated dot-grid backdrop (no gradient). Tasteful and professional, never distracting; content fully readable with motion disabled (`prefers-reduced-motion`).
- R13. Accessible: semantic landmarks, sufficient contrast, keyboard-navigable nav and links.

### Success Criteria

- A first-time visitor can state what VeriGate does and how to try/integrate it after one screen and one scroll.
- Live stats reflect real provider data (or a clean empty state).
- Visual language is consistent with the existing dashboard; the page reads as professional and uncluttered.
- No layout shift or overflow at common mobile and desktop widths.

### Scope Boundaries

**Deferred for later**

- Light theme, internationalization, a blog or additional marketing pages, custom illustrations.

**Outside this product's identity**

- Gradient, 3D/WebGL, or heavy animated backgrounds — explicitly excluded by the design brief.
- A generic marketing site detached from the live product; the landing stays tied to the running app (live stats, real proof).

### Dependencies / Assumptions

- New dependency: `framer-motion` (animations).
- Reuses the provider metrics API (`/api/metrics`) already consumed by the dashboard, and the existing domain constants (`verigate.staifdev.codes`, `api-verigate.staifdev.codes`).
- Moving the dashboard to `/dashboard` requires updating internal links (nav, order/badge back-links) to the new path.
