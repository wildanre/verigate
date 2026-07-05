# VeriGate — Verification-as-a-Service Agent

**CROO Agent Hackathon · Track: Data & Verification Agents (track kedua: Developer Tooling)**
Dokumen project lengkap · Dibuat 5 Juli 2026 · **Deadline submit: 9 Juli 2026, 23:59 UTC+8**

---

## 1. Ringkasan

**Pitch satu kalimat:** VeriGate adalah agent CAP yang di-hire oleh *agent lain* (dan manusia) untuk memverifikasi output AI — fact-check dengan sumber, validasi schema/format, dan deteksi halusinasi — sebelum output itu dikirim sebagai delivery proof. Bayar per verifikasi dalam USDC, hasil verifikasi ter-hash on-chain.

**Mengapa ini "mustahil di API marketplace biasa" (kriteria Innovation 20%):**

- Hasil verifikasi menjadi bagian rantai kepercayaan on-chain: hash laporan verifikasi masuk ke delivery proof CAP, permanen dan tamper-proof.
- Agent lain bisa meng-hire VeriGate secara otonom di tengah order mereka sendiri (A2A), tanpa API key, tanpa langganan — cukup escrow USDC.
- Reputasi (PTS) VeriGate terbangun dari order yang selesai, sehingga "verified by VeriGate" punya bobot yang bisa diaudit siapa pun.

**Mengapa ini strategis untuk menang:**

| Kriteria juri | Bobot | Cara VeriGate menang |
|---|---|---|
| Technical Execution | 30% | Integrasi CAP penuh (negotiate→pay→deliver→settle), state handling via WebSocket, retry idempotent. Target bonus: 10+ order nyata. |
| A2A Composability | 25% | Model bisnisnya *adalah* A2A: pelanggan utamanya agent peserta hackathon lain. Setiap tim yang memakai VeriGate = counterparty unik baru. |
| Innovation | 20% | Verification-first adalah filosofi inti CAP; VeriGate mengubahnya jadi layanan yang bisa dibeli. |
| Usability & Adoption | 15% | Ada kebutuhan nyata *selama hackathon berlangsung* — semua tim butuh QA output. Distribusi via Discord CROO. |
| Presentation | 10% | Demo 2 agent live: agent riset meng-hire VeriGate di tengah ordernya sendiri. |

---

## 2. Spesifikasi Produk

### 2.1 Layanan (Services di Agent Store)

Daftarkan 3 service terpisah agar terlihat kaya dan harga masuk akal untuk micro-order:

| # | Service | Input (Requirements) | Output (Deliverable) | Harga | SLA |
|---|---|---|---|---|---|
| 1 | **Fact-Check with Sources** | Schema: `{claims: string[] \| text}` | Schema: verdict per klaim + sumber URL + confidence | 0.05 USDC | 0h 30m |
| 2 | **Schema & Output Validation** | Schema: `{output: any, expected_schema: object, rules?: string[]}` | Schema: pass/fail + daftar violation + saran perbaikan | 0.015 USDC | 0h 10m |
| 3 | **Hallucination / Consistency Check** | Schema: `{source_text: string, generated_text: string}` | Schema: skor grounding 0–100 + kalimat yang tidak didukung sumber | 0.02 USDC | 0h 15m |

Harga rendah disengaja: memudahkan agent lain memanggil berkali-kali → volume order naik → bonus "10+ real CAP orders" tercapai organik.

### 2.2 Format laporan verifikasi (deliverable schema)

```json
{
  "verdict": "pass | fail | partial",
  "score": 87,
  "checks": [
    {
      "claim": "Base mainnet chain ID is 8453",
      "result": "supported",
      "sources": ["https://docs.base.org/..."],
      "confidence": 0.95
    }
  ],
  "report_hash": "keccak256-of-full-report",
  "verified_by": "VeriGate v1.0",
  "timestamp": "2026-07-07T10:00:00Z"
}
```

`report_hash` dihitung sebelum deliver — CAP sudah menulis keccak256 deliverable on-chain, jadi laporan bisa diverifikasi ulang oleh siapa pun.

### 2.3 Mesin verifikasi (di balik layar)

- **Fact-check:** LLM (Claude/GPT) mengekstrak klaim → web search per klaim → LLM menilai supported/refuted/unverifiable dengan URL sumber.
- **Schema validation:** validasi deterministik dengan `ajv` (JSON Schema) + rule engine sederhana; LLM hanya untuk saran perbaikan.
- **Hallucination check:** LLM membandingkan generated_text vs source_text kalimat per kalimat (NLI-style grounding).

Deterministik dulu, LLM belakangan — ini membuat hasil lebih bisa dipertanggungjawabkan saat human spot-check juri.

---

## 3. Arsitektur

```
                        ┌──────────────────────────────┐
 Agent lain (Requester) │         VeriGate             │
 ── NegotiateOrder ───► │                              │
 ── PayOrder (escrow) ─►│  ┌────────────────────────┐  │
                        │  │ CAP Provider Loop      │  │
   CROO / Base L2       │  │ (Node.js + @croo/sdk)  │  │
   CAPCore + CAPVault   │  │ WS: negotiation_created│  │
                        │  │     order_paid          │  │
                        │  └───────────┬────────────┘  │
                        │              ▼               │
                        │  ┌────────────────────────┐  │
                        │  │ Verification Engine    │  │
                        │  │ • claim extractor      │  │
                        │  │ • web search           │  │
                        │  │ • ajv schema validator │  │
                        │  │ • grounding scorer     │  │
                        │  └───────────┬────────────┘  │
 ◄── DeliverOrder ──────│              ▼               │
     (hash on-chain,    │  Report builder + keccak256  │
      USDC settle)      └──────────────────────────────┘
```

Komponen: 1 proses Node.js long-running (provider loop), 1 modul verifikasi, tanpa database wajib (opsional SQLite untuk log order). Deploy di VPS/Railway/Fly.io agar online 24 jam selama penjurian.

---

## 4. Integrasi CAP — Langkah Teknis

### 4.1 Setup (Dashboard, sekali)

1. Daftar di [agent.croo.network](https://agent.croo.network) (wallet/Google/email).
2. **My Agents → Register Agent** → nama "VeriGate" + avatar → sistem membuat AA wallet + DID. **Simpan API Key (hanya muncul sekali).**
3. **Configure**: deskripsi, skill tags (pilih yang terkait data/verification), lalu **+ Add Service** untuk ketiga service di §2.1 (Deliverable: `Schema`, Requirements: `Schema`).
4. Gas disponsori platform (tidak perlu ETH). USDC hanya dibutuhkan requester.

### 4.2 Provider loop (Node.js)

```bash
npm install @croo-network/sdk ajv
export CROO_API_URL="https://api.croo.network"
export CROO_WS_URL="wss://api.croo.network/ws"
export CROO_SDK_KEY="croo_sk_..."
```

```ts
import { AgentClient, EventType, DeliverableType } from '@croo-network/sdk';
import { runVerification } from './engine';

const client = new AgentClient(
  { baseURL: process.env.CROO_API_URL!, wsURL: process.env.CROO_WS_URL! },
  process.env.CROO_SDK_KEY!
);

async function main() {
  const stream = await client.connectWebSocket();

  // 1. Terima negosiasi masuk → auto-accept
  stream.on(EventType.NegotiationCreated, async (e) => {
    await client.acceptNegotiation(e.negotiation_id); // trigger createOrder on-chain
  });

  // 2. Order dibayar (escrow terkunci) → kerjakan → deliver
  stream.on(EventType.OrderPaid, async (e) => {
    const order = await client.getOrder(e.order_id);
    const report = await runVerification(order);      // engine §2.3
    await client.deliverOrder(e.order_id, {
      type: DeliverableType.Schema,
      data: report,                                   // hash keccak256 ditulis on-chain
    });
  });

  console.log('VeriGate online — listening for orders');
}
main();
```

Catatan penting dari docs:

- `deliverOrder` gagal on-chain → order tetap `paid`, panggilan bisa di-retry (idempotent).
- Lewat SLA tanpa deliver → escrow auto-refund ke requester. Set SLA longgar tapi realistis.
- File besar: `uploadFile()` → sertakan object key di delivery; requester ambil via `getDownloadURL()` (30 menit).

### 4.3 Demo requester (untuk video + testing)

Daftarkan agent kedua ("DemoResearcher"), deposit USDC ke **AA Wallet Address**-nya (bukan Controller/Executor), lalu:

```ts
const neg = await requester.negotiateOrder({ serviceId: VERIGATE_SERVICE_ID, /* input */ });
// tunggu order_created → payOrder → tunggu order_completed → getDelivery
```

---

## 5. Rencana Build 4 Hari (5–9 Juli)

**Hari 1 — Sabtu 5 Juli: Fondasi**
Register agent + 3 service di Dashboard. Jalankan contoh provider/requester dari SDK sampai 1 order end-to-end sukses (negotiate→pay→deliver→settle). Setup repo publik (MIT), struktur project.

**Hari 2 — Minggu 6 Juli: Engine**
Bangun ketiga verifier (schema validator dulu — paling cepat & deterministik, lalu hallucination check, lalu fact-check). Unit test. Sambungkan ke provider loop. Deploy ke VPS.

**Hari 3 — Senin 7 Juli: Order nyata + distribusi**
Umumkan di Discord CROO: "VeriGate live — verifikasi output agent-mu, 0.015–0.05 USDC." Tawarkan verifikasi gratis-ongkos ke 5–10 tim lain (mereka bayar USDC kecil, kamu bantu integrasi). Target: ≥10 order, ≥3 counterparty agent, ≥5 buyer wallet. Klaim juga **Onboarding Bounty ($10)**. Tulis README lengkap.

**Hari 4 — Selasa 8 Juli: Polish + submit**
Rekam demo video ≤5 menit. Finalisasi README (setup, SDK methods used, integration notes). File BUIDL di DoraHacks — **submit malam ini, jangan tunggu 9 Juli**. Sisakan 9 Juli untuk buffer perbaikan.

---

## 6. Strategi Order & Anti-Sybil

Syarat kelayakan hadiah (bukan auto-DQ, tapi direview):

- ≥ 3 counterparty agent unik → dapatkan dari tim hackathon lain (win-win: order VeriGate menaikkan skor A2A *mereka* juga — pakai ini sebagai pitch di Discord).
- ≥ 5 buyer wallet unik → minta teman/komunitas mencoba dari wallet berbeda dengan input berbeda dan hasil yang benar-benar dipakai.
- Hindari pola self-trade terkonsentrasi → jangan membombardir dari 1–2 wallet milik sendiri; variasikan waktu, input, dan counterparty.
- Siap human spot-check → semua order harus menghasilkan laporan verifikasi asli yang bisa direproduksi dari repo.

Hard-DQ yang wajib dihindari: repo private, fork tanpa modifikasi berarti, demo palsu, integrasi CAP yang rusak.

---

## 7. Checklist Submission (DoraHacks BUIDL)

- [ ] Agent live & terlisting di CROO Agent Store (Base mainnet)
- [ ] Callable via CAP, settle USDC on-chain, ≥1 order completed (target 10+)
- [ ] Repo GitHub publik, lisensi MIT/Apache-2.0
- [ ] README: deskripsi, arsitektur, setup step-by-step, SDK methods yang dipakai (`connectWebSocket`, `acceptNegotiation`, `deliverOrder`, `getOrder`, dst.), integration notes
- [ ] Demo video ≤5 menit (link YouTube unlisted boleh)
- [ ] BUIDL DoraHacks: semua field wajib terisi, pilih track Data & Verification (+opsional Developer Tooling, maks 2)
- [ ] Submit sebelum 9 Juli 23:59 UTC+8

## 8. Skrip Demo Video (5 menit)

1. **0:00–0:30** Masalah: agent bisa mengeksekusi, tapi siapa yang menjamin outputnya benar? (1 kalimat visi verification-first CAP)
2. **0:30–1:30** Tunjukkan VeriGate di Agent Store: 3 service, harga, DID.
3. **1:30–3:30** Live run: DemoResearcher meng-hire VeriGate → escrow terkunci → laporan verifikasi terkirim → settlement USDC + hash on-chain (tunjukkan tx di Basescan).
4. **3:30–4:30** Bukti A2A: dashboard order — N order, M counterparty agent berbeda.
5. **4:30–5:00** Repo, cara pakai 3 baris, roadmap (dispute-assist, reputasi verifier).

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Kurang counterparty (< 3 agent) | Mulai outreach Discord Hari 3, jangan Hari 4. Tawarkan bantuan integrasi. |
| SLA terlewat saat trafik demo | SLA 30m longgar; engine schema validation < 5 detik; queue sederhana. |
| API/WS CROO bermasalah (platform baru) | Auto-reconnect sudah built-in SDK; log semua order; retry idempotent. |
| Fact-check lambat/mahal | Batasi maks 5 klaim per order; cache hasil search. |
| Telat submit | BUIDL difile 8 Juli malam; 9 Juli hanya untuk revisi. |

---

## 10. Referensi

- Hackathon: https://dorahacks.io/hackathon/croo-hackathon/detail · https://campaigns.croo.network/hackathon.html
- Quick Start: https://docs.croo.network/developer-docs/quick-start
- Order Lifecycle: https://docs.croo.network/developer-docs/core-concepts/order-lifecycle
- Node.js SDK: https://docs.croo.network/developer-docs/sdk-reference/node.js-sdk-reference · https://github.com/CROO-Network/node-sdk
- Agent Store: https://agent.croo.network · Discord: https://discord.gg/M5JDzYQxSw
