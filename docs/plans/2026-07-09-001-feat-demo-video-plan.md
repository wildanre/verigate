---
title: VeriGate Demo Video (Remotion) - Plan
type: feat
date: 2026-07-09
topic: demo-video-remotion
artifact_contract: ce-unified-plan/v1
artifact_readiness: requirements-only
product_contract_source: ce-brainstorm
execution: code
---

# VeriGate Demo Video (Remotion) - Plan

## Goal Capsule

- **Objective:** A ~90–110s hybrid demo video (Remotion → MP4) for the CROO hackathon BUIDL, combining branded motion-graphics with real product footage and an ElevenLabs voiceover — ready to upload to DoraHacks today.
- **Product authority:** User.
- **Open blockers:** ElevenLabs API key not yet provided (voiceover track). The video is built voiceless-capable so it renders and submits without the key; voiceover drops in once the key arrives.

---

## Product Contract

### Summary

Build the demo video as a Remotion project under `demo-video/remotion/`. Seven scenes (intro → problem → 3 services → CAP flow → live-data proof → why-CAP → close) as motion-graphics, intercut with freshly-recorded footage of the live product (dashboard with real orders, playground catching a hallucination, a Basescan tx). An ElevenLabs voiceover narrates the `docs/DEMO-SCRIPT.md` copy; captions and a royalty-free music bed accompany it. Real metrics are injected as props so the data on screen is true.

### Key Decisions

- **Hybrid, not pure motion-graphics.** Real product footage (embedded via Remotion `<Video>`) proves VeriGate is genuinely live on mainnet; motion-graphics add the polish and data highlights. Credibility is the priority for judges.
- **ElevenLabs TTS for voiceover.** Manifest's OpenAI-compatible gateway does not proxy `/v1/audio/speech` (verified: 404), so voiceover uses a real ElevenLabs key. Narration text comes from `docs/DEMO-SCRIPT.md`.
- **Voiceless-capable first.** The timeline works with captions + music alone, so it renders and submits even before the ElevenLabs key arrives; the voice track slots in as `<Audio>` without reflowing scenes.
- **Render locally.** `npx remotion render` to an MP4; no Lambda/cloud rendering.

### Requirements

**Project & structure**

- R1. Remotion project scaffolded at `demo-video/remotion/` (blank template), separate from the product app.
- R2. One `<Composition>` (1920×1080, 30fps) whose duration derives from the scene timeline (~90–110s); scenes composed with `Series`/`TransitionSeries`.
- R3. Real metrics (total orders, completed, unique counterparties, verdict mix) passed as `defaultProps` so on-screen data is accurate; sourced from the live provider metrics at build time.

**Scenes (motion-graphics + footage)**

- R4. Intro: VeriGate wordmark + tagline "Hire an agent to check your agent", brand-consistent (dark, single green accent, no gradient).
- R5. Problem: one-line kinetic statement — agents can act, but who checks the output.
- R6. Services: the three services with prices, animated (schema / grounding / fact-check); "paid in USDC, hashed on-chain".
- R7. CAP flow: negotiate → pay → verify → deliver on-chain → settle, animated.
- R8. Proof + live data: animated counters for real numbers, verdict mix (pass/fail/partial), and a Basescan delivery tx; may cut to real dashboard footage.
- R9. Why CAP + adoption: on-chain proof, autonomous A2A, real external buyers.
- R10. Close: URLs (`verigate.staifdev.codes`, GitHub) + "Try it free".

**Footage, audio, captions**

- R11. Fresh product footage of the current (redesigned) site — dashboard, playground running a grounding check, a Basescan tx — captured and embedded via `<Video>`; the stale earlier `.webm` is not reused.
- R12. ElevenLabs voiceover generated per scene from `docs/DEMO-SCRIPT.md`, stored in `demo-video/remotion/public/`, played via `<Audio>`; timeline syncs scene durations to the narration.
- R13. On-screen captions track the narration (readable, brand-consistent), so the video communicates fully with sound off.
- R14. A royalty-free (or original) music bed at low volume; no copyrighted music.
- R15. Deterministic build — no `Math.random()`; use Remotion `random()` with a static seed.

**Output**

- R16. Rendered to an MP4 (`demo-video/remotion/out/`), ≤5 minutes, suitable for a DoraHacks / YouTube upload.

### Scope Boundaries

**Deferred for later**

- Lambda/cloud rendering, multi-language narration, alternate cuts or aspect ratios (e.g. vertical).

**Outside this product's identity**

- Copyrighted music or stock clips; heavily-produced effects that obscure the product.

### Dependencies / Assumptions

- **ElevenLabs API key** (user-provided) for R12; until then the video renders voiceless (R11, R13, R14).
- A **royalty-free music** file supplied or omitted; no copyrighted audio.
- Remotion + `@remotion/media` / `@remotion/transitions`; guidance from the installed `remotion-best-practices` skill and `demo-video/REMOTION-REFERENCE.md`.
- Narration copy from `docs/DEMO-SCRIPT.md`; live numbers from the provider metrics API.
