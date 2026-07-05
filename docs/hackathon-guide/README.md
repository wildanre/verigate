# VeriGate — Dokumentasi Lengkap
### Verification-as-a-Service Agent · CROO Agent Hackathon 2026

Dokumen ini adalah referensi tunggal untuk seluruh project: detail hackathon, prasyarat, setup akun & wallet, registrasi service, implementasi kode, deployment, strategi order, submission, dan troubleshooting. Semua informasi diverifikasi dari dokumentasi resmi CROO (docs.croo.network) dan halaman hackathon per 5 Juli 2026.

---

# BAGIAN 1 — DETAIL HACKATHON

## 1.1 Informasi Umum

| Item | Detail |
|---|---|
| Nama | CROO Agent Hackathon |
| Platform | DoraHacks — https://dorahacks.io/hackathon/croo-hackathon/detail |
| Penyelenggara | CROO Network (protokol agent commerce di Base L2) |
| Periode | 9 Juni – 24 Juli 2026 |
| Prize pool | $10,200 USDC + benefit non-tunai |
| Format | Online, 30-day build sprint |

## 1.2 Timeline (PENTING)

| Tanggal | Milestone |
|---|---|
| 9 Jun | Kickoff, registrasi dibuka |
| 9 Jun – 9 Jul | Build sprint |
| **9 Jul · 23:59 UTC+8** | **Deadline submission BUIDL** ← tinggal 4 hari dari sekarang |
| 10–15 Jul | Internal review / shortlisting |
| 16 Jul | Demo Day (presentasi live) |
| 17–23 Jul | Final judging |
| 24 Jul | Pengumuman pemenang |

## 1.3 Hadiah

| Posisi | Hadiah |
|---|---|
| 1st — Grand Champion | $3,500 USDC |
| 2nd | $2,500 USDC |
| 3rd | $1,500 USDC |
| 4th–10th (7 pemenang) | $300 USDC each |
| Most Popular Agent | $300 USDC (data-driven, anti-sybil reviewed) |
| Most Innovative Agent | $300 USDC (pilihan juri) |
| Non-tunai | Featured listing di Agent Store (top finisher), whitelist airdrop $CROO (top 10), permanent listing (semua submission valid) |

## 1.4 Track (pilih maks 2 per BUIDL)

1. 🔬 Research & Intelligence Agents — riset berbayar dengan sumber terverifikasi
2. ✅ **Data & Verification Agents — provenance, credentials, output checks ← track utama VeriGate**
3. 🎨 Creator & Content Ops Agents
4. ⛓️ DeFi / On-chain Ops Agents
5. 🛠️ **Developer Tooling Agents ← track kedua VeriGate (opsional)**
6. ∞ Open — Any A2A Agents

## 1.5 Kriteria Penilaian

| Kriteria | Bobot | Detail |
|---|---|---|
| Technical Execution | 30% | Integrasi CAP robust, interaksi A2A reliabel, payment state handling benar. **Bonus: 10+ order CAP nyata selama hackathon.** |
| A2A Composability | 25% | Jumlah, keragaman, dan kedalaman relasi agent-to-agent. CROO memberi data order agregat ke juri. |
| Innovation | 20% | Use case yang sulit ditiru — "apakah ini mustahil (atau jauh lebih buruk) di API marketplace biasa?" |
| Usability & Real Adoption | 15% | Jalur ke user nyata, interaksi organik awal, potensi retensi. |
| Presentation | 10% | Kejelasan demo, README reproducible, value-prop tajam. Dinilai saat Demo Day. |

## 1.6 Syarat Wajib Setiap BUIDL

1. **Terlisting di CROO Agent Store** — discoverable oleh manusia & agent lain, Base mainnet.
2. **Terintegrasi CAP** — callable dan settle on-chain dalam USDC.
3. **Open source** — repo GitHub publik, lisensi permisif (MIT / Apache-2.0 / sejenis).
4. **Demo + README** — video demo maks 5 menit, instruksi setup, SDK methods yang dipakai, catatan integrasi.
5. **BUIDL difile di DoraHacks** — semua field wajib terisi sebelum deadline.

## 1.7 Anti-Sybil & Diskualifikasi

**Hard disqualification (langsung gugur):**
- Repo private atau kode tidak bisa diverifikasi
- Fork copy-paste tanpa modifikasi berarti
- Demo palsu, integrasi CAP rusak, atau gagal human spot-check

**Flag kelayakan hadiah (direview, bukan auto-DQ):**
- < 3 counterparty agent unik
- < 5 buyer wallet unik
- Pola self-trade terkonsentrasi
- Gagal audit acak 10% oleh manusia

**Banding:** jendela 48 jam setelah notifikasi, direview anggota CROO Core yang tidak terlibat.

## 1.8 Program Paralel (bonus mudah)

| Program | Periode | Hadiah |
|---|---|---|
| Onboarding Bounty — list agent + integrasi CAP + settle 1 pembayaran USDC nyata | s.d. 9 Jul | $10/agent, 100 agent pertama |
| Season 1 Leaderboard (TVL/Orders/Rising Star) | s.d. 7 Jul | pool $11,220 USDC |

VeriGate otomatis memenuhi syarat Onboarding Bounty — klaim saja.

---

# BAGIAN 2 — PRASYARAT

## 2.1 Akun & Aset

| Kebutuhan | Detail |
|---|---|
| Akun CROO | Daftar di https://agent.croo.network — via wallet (EOA), Google, atau email |
| Akun DoraHacks | https://dorahacks.io — untuk register hackathon & file BUIDL |
| Wallet EOA | MetaMask/Rabby dsb. — menjadi "Owner" semua agent Anda (untuk withdraw) |
| USDC di Base | Sedikit saja (mis. $5–10) — hanya untuk wallet *requester* demo membayar order. Token: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| ETH untuk gas | **TIDAK PERLU** — semua gas disponsori platform (Paymaster/Pimlico) |
| GitHub | Repo publik + lisensi MIT/Apache-2.0 |
| Discord CROO | https://discord.gg/M5JDzYQxSw — wajib untuk outreach & support |

## 2.2 Lingkungan Development

| Kebutuhan | Detail |
|---|---|
| Runtime | Node.js 18+ (dipakai dokumen ini) — alternatif: Go 1.22+ / Python 3.10+ |
| SDK | `npm install @croo-network/sdk` |
| Library tambahan | `ajv` (validasi JSON Schema), SDK LLM (Anthropic/OpenAI), API web search (mis. Brave/Tavily) |
| API key LLM | Untuk mesin verifikasi (fact-check & grounding) |
| Server deploy | VPS / Railway / Fly.io — provider harus online 24 jam selama penjurian (10–23 Jul) |
| Perekam layar | Untuk video demo ≤5 menit |

## 2.3 Konsep Kunci yang Harus Dipahami

**Hierarki akun CROO:**
```
User (Owner EOA — wallet Anda)
├── Navigator  → akun utama, dibuat otomatis; saldo utama & requester default
├── Agent "VeriGate"       → AA wallet sendiri, DID sendiri, API Key sendiri
└── Agent "DemoResearcher" → agent kedua untuk demo requester
```

**Dual-role permission (per AA wallet):**
- *Owner* (Anda): withdraw, listing Exchange. TIDAK bisa operasi order.
- *Executor* (platform): createOrder/payOrder/deliverOrder. TIDAK bisa withdraw.
- Anda tidak pernah memegang private key protokol; SDK meminta signing ke backend via API Key.

**Status agent:** `draft` (belum konek SDK, tak terlihat di Store) → `online` (WebSocket handshake sukses, bisa terima order) → `offline`.

**Order lifecycle:** `pending negotiation` → accept → `created` (on-chain) → pay → `paid` (escrow di CAPVault, SLA countdown mulai) → deliver (hash keccak256 on-chain) → `completed` (settle: fee platform → treasury, sisa → AA wallet provider). Timeout SLA atau reject saat `paid` → escrow auto-refund ke requester.

---

# BAGIAN 3 — SETUP LANGKAH DEMI LANGKAH

## 3.1 Registrasi Agent (Dashboard)

1. Buka https://agent.croo.network → sign in.
2. **My Agents → Register Agent** → nama `VeriGate`, upload avatar.
3. Sistem membuat AA wallet (ERC-4337 via Biconomy Nexus) + mint DID.
4. **SALIN API KEY (`croo_sk_...`) — hanya ditampilkan sekali.** Simpan di password manager. (Jika hilang: rotate di Configure, key lama langsung invalid.)

## 3.2 Konfigurasi Agent

Di halaman Configure:
- **Description:** "Verification-as-a-Service: fact-checking with sources, schema/output validation, and hallucination detection for AI agent outputs. Hire VeriGate before you deliver."
- **Skill Tags:** pilih 1–5 dari library standar (yang relevan dengan data/verification, mis. `data-verification`, `code-review`, atau terdekat yang tersedia).

## 3.3 Registrasi 3 Service (+ Add Service)

**Service 1 — Fact-Check with Sources** · 0.05 USDC · SLA 0h 30m
- Requirements: `Schema` → field `text` (string, required) atau `claims` (array of string)
- Deliverable: `Schema` → `verdict` (string), `score` (number), `checks` (array of object: claim, result, sources, confidence)

**Service 2 — Schema & Output Validation** · 0.015 USDC · SLA 0h 10m
- Requirements: `Schema` → `output` (object/string, required), `expected_schema` (object, required), `rules` (array, optional)
- Deliverable: `Schema` → `verdict` (string), `violations` (array), `suggestions` (array)

**Service 3 — Hallucination / Grounding Check** · 0.02 USDC · SLA 0h 15m
- Requirements: `Schema` → `source_text` (string, required), `generated_text` (string, required)
- Deliverable: `Schema` → `grounding_score` (number 0–100), `unsupported_sentences` (array), `verdict` (string)

Catatan: SLA dikonversi ke detik saat order dibuat (minimum 300 detik). Harga & SLA bisa diubah kapan pun di Dashboard; order baru memakai nilai terbaru.

## 3.4 Registrasi Agent Kedua (Demo Requester)

1. Register agent `DemoResearcher` (ulangi 3.1–3.2, service tidak wajib).
2. Salin **AA Wallet Address** dari halaman Configure-nya.
3. Kirim USDC (Base) ke alamat AA wallet itu — **BUKAN ke Controller/Executor address**.

## 3.5 Environment Variables

```bash
# Provider (VeriGate)
export CROO_API_URL="https://api.croo.network"
export CROO_WS_URL="wss://api.croo.network/ws"
export CROO_SDK_KEY="croo_sk_...verigate..."

# Requester (DemoResearcher) — proses terpisah
export CROO_SDK_KEY="croo_sk_...demoresearcher..."
export CROO_TARGET_SERVICE_ID="<service-id-verigate>"
```

⚠️ Satu API Key = satu koneksi WebSocket aktif. Jangan jalankan dua proses dengan key sama (error `1008: key already has an active connection`).

---

# BAGIAN 4 — IMPLEMENTASI

## 4.1 Struktur Repo

```
verigate/
├── src/
│   ├── provider.ts        # CAP provider loop (entry point)
│   ├── engine/
│   │   ├── index.ts       # router: order → verifier sesuai serviceId
│   │   ├── factcheck.ts   # verifier 1: klaim → search → verdict + sumber
│   │   ├── schema.ts      # verifier 2: ajv + rule engine (deterministik)
│   │   └── grounding.ts   # verifier 3: NLI-style grounding scorer
│   └── report.ts          # builder laporan + keccak256 hash
├── demo/
│   └── requester.ts       # skrip demo requester end-to-end
├── test/
├── .env.example
├── LICENSE                # MIT
└── README.md
```

## 4.2 Provider Loop (src/provider.ts)

```ts
import { AgentClient, EventType, DeliverableType } from '@croo-network/sdk';
import { runVerification } from './engine';

const client = new AgentClient(
  {
    baseURL: process.env.CROO_API_URL!,
    wsURL: process.env.CROO_WS_URL!,
    logger: console,
  },
  process.env.CROO_SDK_KEY!
);

async function main() {
  const stream = await client.connectWebSocket(); // status agent → online

  // Negosiasi masuk → auto-accept (trigger createOrder on-chain, dual-sig oleh backend)
  stream.on(EventType.NegotiationCreated, async (e: any) => {
    try {
      await client.acceptNegotiation(e.negotiation_id);
      console.log('accepted negotiation', e.negotiation_id);
    } catch (err) {
      console.error('accept failed', err);
    }
  });

  // Escrow terkunci → kerjakan → deliver (idempotent, boleh retry)
  stream.on(EventType.OrderPaid, async (e: any) => {
    const orderId = e.order_id;
    try {
      const order = await client.getOrder(orderId);
      const report = await runVerification(order); // pilih verifier by serviceId
      await client.deliverOrder(orderId, {
        type: DeliverableType.Schema,
        data: report, // keccak256(deliverable) ditulis on-chain otomatis
      });
      console.log('delivered', orderId);
    } catch (err) {
      console.error('verification failed', orderId, err);
      // Gagal permanen? Reject agar escrow refund — jaga reputasi:
      // await client.rejectOrder(orderId, 'verification engine failure');
    }
  });

  stream.on(EventType.OrderCompleted, (e: any) =>
    console.log('settled ✓', e.order_id)
  );

  console.log('VeriGate online — waiting for orders');
}

main().catch(console.error);
```

## 4.3 Engine Router (src/engine/index.ts)

```ts
import { factCheck } from './factcheck';
import { validateSchema } from './schema';
import { groundingCheck } from './grounding';
import { buildReport } from '../report';

const SERVICE_MAP: Record<string, (input: any) => Promise<any>> = {
  [process.env.SVC_FACTCHECK_ID!]: factCheck,
  [process.env.SVC_SCHEMA_ID!]: validateSchema,
  [process.env.SVC_GROUNDING_ID!]: groundingCheck,
};

export async function runVerification(order: any) {
  const verifier = SERVICE_MAP[order.service_id];
  if (!verifier) throw new Error(`unknown service ${order.service_id}`);
  const input = order.requirements; // sesuai schema Requirements service
  const result = await verifier(input);
  return buildReport(result); // + report_hash, verified_by, timestamp
}
```

## 4.4 Verifier Deterministik (src/engine/schema.ts) — bangun ini duluan

```ts
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

export async function validateSchema(input: {
  output: unknown; expected_schema: object; rules?: string[];
}) {
  const validate = ajv.compile(input.expected_schema);
  const valid = validate(input.output);
  return {
    verdict: valid ? 'pass' : 'fail',
    violations: (validate.errors ?? []).map(e => `${e.instancePath} ${e.message}`),
    suggestions: valid ? [] : ['Fix the listed fields to conform to expected_schema'],
  };
}
```

## 4.5 Fact-Check (src/engine/factcheck.ts) — garis besar

```ts
// 1. LLM mengekstrak klaim atomik dari input.text (maks 5 klaim/order)
// 2. Per klaim: web search (Brave/Tavily) → ambil top-3 snippet + URL
// 3. LLM menilai: supported / refuted / unverifiable + confidence + sumber
// 4. verdict agregat: pass (semua supported), partial, fail
// Cache hasil search (in-memory/SQLite) agar hemat biaya & cepat.
```

## 4.6 Report Builder (src/report.ts)

```ts
import { keccak256, toUtf8Bytes } from 'ethers';

export function buildReport(result: object) {
  const core = {
    ...result,
    verified_by: 'VeriGate v1.0',
    timestamp: new Date().toISOString(),
  };
  return { ...core, report_hash: keccak256(toUtf8Bytes(JSON.stringify(core))) };
}
```

## 4.7 Demo Requester (demo/requester.ts)

```ts
import { AgentClient, EventType } from '@croo-network/sdk';

const client = new AgentClient({ baseURL: ..., wsURL: ... }, process.env.CROO_SDK_KEY!);

async function main() {
  const stream = await client.connectWebSocket();

  const neg = await client.negotiateOrder({
    serviceId: process.env.CROO_TARGET_SERVICE_ID!,
    requirements: {
      source_text: 'Base is an Ethereum L2 with chain ID 8453...',
      generated_text: 'Base is an L2 with chain ID 8453 launched by Coinbase in 2019.',
    },
  });

  stream.on(EventType.OrderCreated, async (e: any) => {
    await client.payOrder(e.order_id); // auto-handle USDC approve
  });

  stream.on(EventType.OrderCompleted, async (e: any) => {
    const delivery = await client.getDelivery(e.order_id);
    console.log('verification report:', JSON.stringify(delivery, null, 2));
    process.exit(0);
  });
}
main();
```

⚠️ Jangan panggil `payOrder` paralel dari wallet yang sama (nonce collision → `NONCE_ERROR`/`PIMLICO_ERROR`). Bayar sekuensial.

## 4.8 SDK Methods yang Dipakai (untuk README — syarat submission)

| Method | Peran | Fungsi |
|---|---|---|
| `connectWebSocket()` | Both | Handshake → agent online; auto-reconnect (1s→30s), heartbeat 30s |
| `acceptNegotiation(id)` | Provider | Terima negosiasi → createOrder on-chain |
| `rejectNegotiation(id, reason)` | Provider | Tolak negosiasi |
| `getOrder(id)` / `listOrders(opts)` | Both | Ambil detail/daftar order |
| `deliverOrder(id, {type, data})` | Provider | Kirim deliverable; hash on-chain |
| `rejectOrder(id, reason)` | Both* | Batalkan (saat `paid`: hanya provider; escrow refund) |
| `negotiateOrder(req)` | Requester | Mulai negosiasi ke serviceId target |
| `payOrder(id)` | Requester | Bayar; auto-approve USDC; escrow terkunci |
| `getDelivery(id)` | Requester | Ambil hasil |
| `uploadFile` / `getDownloadURL` | Both | Deliverable berbasis file (URL valid 30 menit) |

## 4.9 Deployment

```bash
# VPS (contoh dengan pm2)
npm ci && npm run build
pm2 start dist/provider.js --name verigate
pm2 save
```
- Set semua env var di server. Provider harus tetap online selama penjurian (10–23 Juli) — status `online` di Store bergantung pada koneksi WebSocket.
- Logging: simpan semua order (id, serviceId, counterparty, timestamp, hasil) — berguna untuk demo & audit juri.

---

# BAGIAN 5 — RENCANA KERJA 4 HARI

**Hari 1 (Sab, 5 Jul) — Fondasi CAP**
- [ ] Akun CROO + register `VeriGate` & `DemoResearcher`, simpan kedua API Key
- [ ] Register hackathon di DoraHacks
- [ ] Deposit USDC ke AA wallet DemoResearcher
- [ ] Konfigurasi 3 service (§3.3)
- [ ] Jalankan contoh SDK sampai 1 order end-to-end sukses
- [ ] Init repo publik (MIT) + struktur §4.1

**Hari 2 (Min, 6 Jul) — Engine**
- [ ] Verifier schema (deterministik) → sambungkan ke provider loop
- [ ] Verifier grounding → verifier fact-check
- [ ] Unit test + error handling (reject bila engine gagal permanen)
- [ ] Deploy ke VPS, agent `online` stabil

**Hari 3 (Sen, 7 Jul) — Order nyata + distribusi**
- [ ] Umumkan di Discord CROO (template §6.2)
- [ ] Onboard ≥3 tim lain sebagai counterparty (bantu integrasi mereka)
- [ ] Kumpulkan ≥10 order, ≥5 buyer wallet unik
- [ ] Klaim Onboarding Bounty ($10)
- [ ] Draft README lengkap

**Hari 4 (Sel, 8 Jul) — Submission**
- [ ] Rekam & edit video demo ≤5 menit (skrip §7.2)
- [ ] Finalisasi README + .env.example + lisensi
- [ ] **File BUIDL di DoraHacks malam ini** (9 Jul = buffer revisi saja)

---

# BAGIAN 6 — STRATEGI ORDER & ANTI-SYBIL

## 6.1 Target Angka

| Metrik | Minimum aman | Target |
|---|---|---|
| Order CAP selesai | 10 (bonus teknis) | 20+ |
| Counterparty agent unik | 3 | 6+ |
| Buyer wallet unik | 5 | 8+ |

## 6.2 Template Outreach (Discord #hackathon)

> 🛡️ **VeriGate is live on the Agent Store** — verification-as-a-service for your agent's outputs.
> Before you `deliverOrder`, let VeriGate check it: schema validation (0.015 USDC), grounding/hallucination check (0.02), fact-check with sources (0.05).
> Bonus for you: every order you place is a real A2A interaction → boosts YOUR composability score too (25% of judging). DM me — happy to help you integrate in ~10 lines.

Poin jual utama: order ke VeriGate menaikkan skor A2A *kedua belah pihak*. Ini insentif organik, bukan sybil.

## 6.3 Aturan Main Bersih

- Variasikan input, waktu, dan counterparty; jangan bombardir dari 1–2 wallet sendiri.
- Setiap order menghasilkan laporan asli yang reprodusibel dari repo (siap human spot-check 10%).
- Barter order dengan tim lain boleh (saling pakai layanan nyata); wash-trading terkonsentrasi tidak.

---

# BAGIAN 7 — SUBMISSION & DEMO

## 7.1 Checklist BUIDL DoraHacks

- [ ] Judul, tagline, deskripsi project
- [ ] Track: **Data & Verification Agents** (+ opsional Developer Tooling; maks 2)
- [ ] Link repo GitHub (publik, MIT/Apache-2.0)
- [ ] Link video demo ≤5 menit
- [ ] Link listing di Agent Store
- [ ] README memuat: setup step-by-step, **SDK methods used** (tabel §4.8), integration notes
- [ ] Bukti order: screenshot dashboard order + link tx Basescan
- [ ] Semua field wajib DoraHacks terisi · submit sebelum **9 Jul 23:59 UTC+8**

## 7.2 Skrip Video Demo (5 menit)

| Waktu | Konten |
|---|---|
| 0:00–0:30 | Masalah: agent bisa mengeksekusi, tapi tak ada yang menjamin outputnya benar. CAP verification-first — VeriGate menjadikannya layanan yang bisa dibeli. |
| 0:30–1:30 | Tunjukkan VeriGate di Agent Store: 3 service, harga, DID, status online. |
| 1:30–3:30 | **Live run:** DemoResearcher negotiate → escrow lock (payOrder) → VeriGate deliver laporan → settlement USDC. Tunjukkan tx di Basescan + hash deliverable on-chain. |
| 3:30–4:30 | Bukti A2A: log order — N order, M counterparty berbeda. Ini interaksi ekonomi antar-agent nyata. |
| 4:30–5:00 | Repo (integrasi ~10 baris), roadmap: dispute-assist, verifier reputation, badge "verified by VeriGate". |

## 7.3 Kerangka README (bahasa Inggris, untuk repo)

```
# VeriGate — Verification-as-a-Service on CROO CAP
one-liner + badge (Base mainnet · CAP · MIT)

## What it does          → 3 services + pricing table
## Why CAP               → on-chain report hash, escrow, A2A, reputation
## Architecture          → diagram §3 dokumen project
## Quick Start           → prerequisites, env vars, npm i, run provider
## Try it (as an agent)  → snippet requester 10 baris
## SDK Methods Used      → tabel §4.8
## Integration Notes     → SLA, idempotent retry, WS single-connection
## Demo                  → link video + tx Basescan
## License               → MIT
```

---

# BAGIAN 8 — TROUBLESHOOTING & FAQ

| Masalah | Penyebab & solusi |
|---|---|
| WebSocket ditolak `1008` | Satu API Key = satu koneksi aktif. Matikan proses lama dulu (hati-hati pm2 restart ganda). |
| `NONCE_ERROR` / `PIMLICO_ERROR` saat bayar | `payOrder` paralel dari wallet sama. Bayar sekuensial. |
| `insufficient_balance` | AA wallet requester kurang USDC. Deposit ke **AA Wallet Address** (bukan Controller/Executor), lalu retry. |
| Deliver gagal (revert) | Order tetap `paid` — retry `deliverOrder` (idempotent). |
| SLA lewat | Escrow auto-refund ke requester. Perbaiki performa engine; SLA jangan terlalu ketat. |
| Order dibayar tapi engine error permanen | `rejectOrder` sebagai provider → escrow refund. Lebih baik daripada expired. |
| Agent tidak muncul di Store | Status masih `draft` — provider belum konek WebSocket, atau service belum lengkap. |
| API Key bocor | Rotate di Configure (key lama langsung mati). Penyerang tak bisa withdraw (butuh Owner signature). |
| Perlu ETH untuk gas? | Tidak. Gas disponsori platform. |
| Ubah harga/SLA | Edit service di Dashboard; berlaku untuk order baru. |

---

# BAGIAN 9 — REFERENSI RESMI

| Sumber | URL |
|---|---|
| Hackathon (DoraHacks) | https://dorahacks.io/hackathon/croo-hackathon/detail |
| Detail hackathon, prize, judging | https://campaigns.croo.network/hackathon.html |
| Docs index (llms.txt) | https://docs.croo.network/llms.txt |
| Quick Start | https://docs.croo.network/developer-docs/quick-start |
| Protocol Overview | https://docs.croo.network/developer-docs/protocol-overview |
| Account & Wallet Architecture | https://docs.croo.network/developer-docs/core-concepts/account-and-wallet-architecture |
| Service Registration | https://docs.croo.network/developer-docs/core-concepts/service-registration |
| Order Lifecycle | https://docs.croo.network/developer-docs/core-concepts/order-lifecycle |
| Node.js SDK Reference | https://docs.croo.network/developer-docs/sdk-reference/node.js-sdk-reference |
| FAQ | https://docs.croo.network/developer-docs/faq |
| SDK GitHub | https://github.com/CROO-Network/node-sdk |
| Kontrak (open source) | https://github.com/CROO-Network/cap-contracts |
| Agent Store | https://agent.croo.network |
| Discord | https://discord.gg/M5JDzYQxSw |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` · Chain ID 8453 |
