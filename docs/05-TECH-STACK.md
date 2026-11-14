# 05 · Technology Stack

**Product:** Tổ Mình Ơi — Smart Neighborhood Assistant (Cẩm Lệ)  
**Budget:** 0 VNĐ  
**Document status:** Locked (v1)

---

## 1. Stack overview

| Layer | Choice | Plan |
|-------|--------|------|
| Frontend + API | Next.js (App Router, TypeScript) | Vercel Free |
| Hosting / CI | Vercel | Free tier |
| Auth | Supabase Auth (email + password) | Free tier |
| Database | Supabase Postgres + `pgvector` | Free tier |
| File storage | Supabase Storage (public bucket) | Free tier |
| LLM (text) | Google Gemini API | Free tier |
| Embeddings | Google Gemini API | Free tier |
| TTS (runtime) | Web Speech API (browser) | 0 VNĐ |
| TTS (fallback MP3) | Edge TTS (pre-generated) | 0 VNĐ |
| Speech input | Web Speech Recognition (browser) | 0 VNĐ |
| PWA | `manifest.json` only (installable shell) | — |

**No paid services. No credit card required.**

---

## 2. Runtime decisions

### 2.1 Next.js

- **App Router** (`src/app/`), TypeScript, React Server Components where safe.
- API logic lives in Route Handlers (`src/app/api/**/route.ts`).
- Client components only where browser APIs are needed: Web Speech, `sessionStorage`, font-size toggle, audio playback.
- **No offline Service Worker.** Wi‑Fi / mobile data required. Only `manifest.json` + icons so “Add to Home Screen” works.
- Node runtime for all AI routes (not Edge) — Gemini SDK and Supabase JS need full Node APIs and stable timeouts.

### 2.2 Supabase

| Capability | Use |
|------------|-----|
| Auth | Admin only. Public sign-up **disabled**. One seeded admin account. |
| Postgres + pgvector | `announcements`, `admin_procedures`, vector similarity RPC |
| Storage | Public bucket `announcements`: original images + pre-generated MP3 |
| RLS | On for all tables. Public read of published announcements + procedures; mutations require authenticated admin. |

Secret key and `GEMINI_API_KEY` are **server-only** env vars. Browser gets only `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

### 2.3 Network requirement

App requires network for:

- Loading bulletin list
- Gemini calls (summarize, chat, scam)
- Uploading images
- Playing fallback MP3 from Storage

No offline cache of content. Documented in UI as a short network hint only if a request fails.

---

## 3. AI models (locked)

Research date: 2026-11-14. Google free tier for **new** projects no longer includes reliable access to `gemini-2.5-flash` (legacy-restricted) or `text-embedding-004`.

### 3.1 Text generation — `gemini-3.5-flash-lite`

| | |
|--|--|
| Model ID | `gemini-3.5-flash-lite` |
| Used for | `/api/summarize`, `/api/chat` (RAG answer + intent + scam analysis) |
| Free tier (measured community, Nov 2026) | ~10–15 RPM, ~250k TPM, **~500 RPD** |
| Why not `gemini-3.6-flash` / `3.8-flash` | Only ~20 RPD — too tight for demo day with judges + residents |
| Fallback | If Vietnamese quality insufficient: pin `gemini-3.6-flash` for offline testing only; do not ship to demo day |

All three text features share one model to keep prompts, retries, and quota accounting in one place.

### 3.2 Embeddings — `gemini-embedding-2` @ 768

| | |
|--|--|
| Model ID | `gemini-embedding-2` |
| `outputDimensionality` | **768** (Google-recommended lower dim; keeps `vector(768)` schema) |
| Used for | Seed-time procedure embeddings + query embedding in `/api/chat` |
| Free tier (measured) | ~100 RPM, ~1000 RPD |
| Distance | Cosine (`<=>` in Postgres) |

Query and documents must use the **same** model + dimensionality. Changing either requires full re-embed.

### 3.3 Model configuration rules

- Pin model IDs in env/config (`GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`). Never hardcode in components.
- Alias `gemini-flash-latest` is **not** used — demo day must not silently jump models.
- Handle `429 RESOURCE_EXHAUSTED`: exponential backoff (max 2 retries), then surface a friendly Vietnamese error in UI.

---

## 4. Text-to-speech strategy

Goal: Vietnamese TTS works on **Android Chrome, desktop, and iOS Safari** during judging, 0 VNĐ, no runtime AI quota.

### 4.1 Primary — Web Speech API

- On “Nghe thông báo” tap (must be inside user gesture for iOS):
  1. `speechSynthesis.getVoices()` → look for `lang` starting with `vi`.
  2. If found: `speechSynthesis.speak()` on the summary text. 0 ms latency, 0 bandwidth.
- Controls: Pause / Resume / Read again (stop + speak).
- Speak only the 3-block summary, not the full original text.

### 4.2 Fallback — pre-generated MP3 (Edge TTS)

If no `vi*` voice (common on iOS Safari until system Vietnamese voice is installed):

- Play `audio_url` from Supabase Storage via HTML5 `<audio>`.
- MP3 generated **at publish time** (and during seed), not on the listener’s device.

| | |
|--|--|
| Voices | `vi-VN-HoaiMyNeural` (default), `vi-VN-NamMinhNeural` (alt) |
| Node package | `@andresaya/edge-tts` (Vercel-compatible, no Python at runtime) |
| Seed script | Python `edge-tts` CLI acceptable for batch seed |
| Output | MP3 ~48–96 kbps, stored in bucket `announcements` as `{id}.mp3` |
| Failure policy | If Edge TTS fails at publish: store `audio_url = null`. Client shows Web Speech only; if neither available, hide listen button and show full text. |

### 4.3 Detection logic (client)

```
hasViVoice = speechSynthesis.getVoices().some(v => v.lang?.toLowerCase().startsWith('vi'))
if (hasViVoice) → Web Speech
else if (announcement.audio_url) → <audio src>
else → no listen button (text remains readable)
```

Note: `getVoices()` may be empty until `voiceschanged` fires — wait for that event once on mount.

### 4.4 Speech recognition (chat input)

- Web Speech Recognition, `lang = 'vi-VN'`.
- Feature-detect: if unsupported (e.g. some iOS versions / Firefox), hide mic button; text input always available.
- Result fills the chat input; user still taps Send (avoids accidental submits).

---

## 5. PWA

| Item | Decision |
|------|----------|
| `manifest.json` | name **Tổ Mình Ơi**, short_name, theme_color, background_color, icons 192 + 512, `display: standalone` |
| Service Worker | **None for offline content.** Optional minimal SW only if Vercel/Next needs it for install prompt — if added, cache app shell only, never API responses |
| Install prompt | Custom banner “Cài đặt ứng dụng vào màn hình chính” dismissible via `localStorage` |
| Offline | Not supported. Network required. |

---

## 6. Auth model

| | |
|--|--|
| Audience | Admin (Tổ trưởng) only |
| Method | Email + password (Supabase Auth) |
| Sign-up | Disabled in Supabase dashboard |
| Seed | One admin created via Supabase admin API / dashboard; credentials in password manager, **never in git** |
| Session | Supabase SSR cookie session on `/admin` and admin API routes |
| Password reset | Manual via Supabase dashboard (single admin; no self-serve reset UI in v1) |
| Residents | No accounts, no PII collection |

---

## 7. Environment variables

```bash
# Public (browser)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server only (Route Handlers / scripts)
SUPABASE_SECRET_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_EMBEDDING_MODEL=gemini-embedding-2
GEMINI_EMBEDDING_DIM=768

# Optional seed/admin
ADMIN_EMAIL=
ADMIN_PASSWORD=
```

**Rules:**

- Never prefix server secrets with `NEXT_PUBLIC_`.
- Never log `GEMINI_API_KEY` or `SUPABASE_SECRET_KEY`.
- Supabase keys: publishable (`sb_publishable_…`) public; secret (`sb_secret_…`) server-only. Legacy `anon`/`service_role` deprecated end of 2026.
- Vercel: set all server vars in Project → Settings → Environment Variables.

---

## 8. Free-tier budget & limits

| Service | Free tier use | Risk on demo day |
|---------|---------------|------------------|
| Vercel | Hobby: serverless, bandwidth, build minutes | Fine for one demo site |
| Supabase | DB, Auth, Storage (1 GB), edge functions n/a | Image + MP3 size must stay modest |
| Gemini text | ~500 RPD flash-lite | Queue UI + friendly 429 message |
| Gemini embed | ~1000 RPD | Seed once; queries tiny |
| Edge TTS | Unofficial free; Microsoft may rate-limit | Pre-generate seed audio; best-effort at publish |
| Web Speech | Free, on-device | iOS needs fallback MP3 |

**Cost statement for PRD:** 0 VNĐ operating cost on free tiers for the competition demo scope.

---

## 9. Explicit non-goals (v1)

- Offline content cache
- Multi-ward / multi-tenant
- Resident accounts or profile data
- Payment, notification push, email marketing
- Admin user management UI (single seeded admin)
- Production-grade WAF, custom domain analytics
- Storing chat history server-side
- Mobile native apps (App Store / CH Play)

---

## 10. Dependency list (implementation)

| Package | Purpose |
|---------|---------|
| `next`, `react`, `react-dom` | App framework |
| `typescript` | Types |
| `@supabase/supabase-js` | DB, Auth, Storage |
| `@supabase/ssr` | Cookie session (admin) |
| `@google/genai` | Gemini text + embedding |
| `@andresaya/edge-tts` | Publish-time Vietnamese MP3 |
| (dev) `edge-tts` Python | Optional batch seed only |

Styling: follow `04-UI-UX-SPEC.md` tokens (CSS variables). No heavy UI kit required; plain React + CSS keeps bundle small for FCP < 2 s.

---

## 11. Quality gates (implementation)

- `npm run lint` / `npm run typecheck` clean
- FCP < 2 s on mid-range Android over 4G (Lighthouse)
- Summarize path < 5 s for 300-word text (excluding cold start)
- Manual matrix: Android Chrome, iOS Safari, desktop Edge — TTS + chat + scam sample
- No `GEMINI_API_KEY` or service key in client bundle (grep build output)

---

## Related documents

- Architecture & request paths → `06-TDD.md`
- Schema & seed → `07-DATABASE.md`
- Endpoint contracts → `08-API-SPEC.md`
- Brand tokens & screens → `04-UI-UX-SPEC.md`
