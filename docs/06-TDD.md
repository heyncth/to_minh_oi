# 06 · Technical Design Document (TDD)

**Product:** Tổ Mình Ơi  
**Stack:** Next.js App Router · Supabase · Gemini  
**Document status:** Locked (v1)

---

## 1. Goals & constraints

| Goal | Constraint |
|------|------------|
| FCP < 2 s on 4G | Small client bundle; server render list shell; lazy heavy widgets |
| Summarize 300 words / 1 image < 5 s | One Gemini call; no sequential multi-step chain |
| 0 VNĐ ops | Free tiers only; no always-on workers |
| Elderly UX | ≤ 2 taps to core actions; min 18px; high contrast |
| No resident PII | No accounts; no server chat log |
| iOS TTS reliability | Web Speech + pre-generated MP3 fallback |

---

## 2. High-level architecture

```text
┌──────────────────────────── Browser ────────────────────────────┐
│  PWA shell (manifest)                                           │
│  Bảng tin UI · Trợily UI · Admin UI                            │
│  Web Speech (TTS/STT) · sessionStorage history · font-scale    │
│  <audio> fallback MP3                                           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │ fetch JSON                  │ Supabase JS (anon + RLS)
                ▼                             ▼
┌─────────────────────────── Next.js (Vercel) ────────────────────┐
│  Route Handlers                                                 │
│  /api/chat          intent → RAG | scam                         │
│  /api/summarize     text|image → structured draft               │
│  /api/announcements CRUD + audio job                            │
│  Auth guard (admin session cookie)                              │
│  Server env: GEMINI_API_KEY, SUPABASE_SECRET_KEY (never exposed) │
└───────┬───────────────────────────────┬─────────────────────────┘
        │                               │
        ▼                               ▼
┌───────────────────┐         ┌─────────────────────┐
│ Gemini API        │         │ Supabase            │
│ flash-lite text   │         │ Postgres + pgvector │
│ embedding-2 @768  │         │ Auth (admin)        │
│ Edge TTS (publish)│         │ Storage (public)    │
└───────────────────┘         └─────────────────────┘
```

---

## 3. App routes (pages)

| Route | Audience | Notes |
|-------|----------|-------|
| `/` | Public | Bảng tin |
| `/tro-ly` | Public | Unified chatbot |
| `/admin` | Admin | List + editor |
| `/admin/login` | Admin | Email/password |
| `/admin/new` | Admin | Create (may merge into `/admin` modal — implementer choice) |

Bottom nav (public): **Bảng tin** · **Trợ lý**.  
Admin is linked from a discreet control on home (or `/admin` direct) — not a third resident tab.

---

## 4. Module A — Bảng tin

### 4.1 Read path

1. Server Component or client fetch `GET /api/announcements` (or Supabase select with RLS).
2. Filter client-side by `category` chips: `Tất cả | Hành chính | Y tế | Môi trường | An ninh | Sự kiện`.
3. Sort: `is_urgent` first within same day optional; primarily `created_at desc`.
4. Card renders 3 blocks + badges + listen control.

### 4.2 TTS controller (`TTSButton`)

```text
state: idle | playing | paused | unsupported
```

Logic:

```
onMount: speechSynthesis.onvoiceschanged → detectViVoice()
onPlay:
  if (viVoice) speak(summary_main) via SpeechSynthesisUtterance
    lang='vi-VN', rate≈0.95
  else if (audio_url) play HTMLAudioElement
  else disable button
onPause: speechSynthesis.pause() | audio.pause()
onRestart: cancel + speak from start / audio.currentTime=0
onUnmount: speechSynthesis.cancel()
```

iOS: only start inside click handler (already true).  
Read **`summary_main` + optional time/location** — keep total speech short.

### 4.3 Admin create/edit

```text
[Mode toggle: Dán văn bản | Tải ảnh]
        │
        ▼
  upload image (if any) → Storage URL
        │
        ▼
  POST /api/summarize → draft form (title, category, urgent, 3 summaries)
        │
  admin edits
        │
        ▼
  POST /api/announcements (is_published toggle)
        │
        ▼
  POST /api/announcements/:id/audio (best-effort)
```

Hidden vs delete: `PATCH is_published=false` keeps history; `DELETE` removes row.

---

## 5. Module B — Trợily (unified chat)

### 5.1 Intent classification

**Design choice: one Gemini call with routing instruction** (fewer RPD than classify-then-answer double call).

System prompt sketch (server):

```text
You are the routing layer for "Tổ Mình Ơi".
Given the latest user message, decide exactly one intent:
- "rag": question about administrative procedures, documents, where/when to submit
- "scam": user wants to check whether a message/link is a scam, or pastes suspicious content

Reply with ONLY JSON:
{"intent":"rag"|"scam"}
```

Then:

- If `rag` → embed + retrieve + **second** Gemini call for grounded answer (2 calls worst case for rag).
- If `scam` → **single** scam-analysis call (can merge: first call returns intent+analysis for scam to save a call).

**Optimization locked for free tier:**

| Path | Gemini calls |
|------|----------------|
| scam | **1** — prompt asks for `{intent, level, reasons, advice}` in one shot |
| rag | **2** — (1) intent JSON, (2) grounded answer · OR 1 call if we embed+retrieve first and only call model when needed |

**Further optimization (recommended implement):**  
Always embed query first (cheap, high RPD). Run `match_procedures`.  
If max similarity ≥ threshold → call Gemini **once** with chunks as context, `type: rag`.  
If max similarity < threshold **and** message looks like scam paste (heuristics: URL, “OTP”, “trúng thưởng”, long paste) → scam prompt.  
If low sim and short question → still one rag call that may emit guardrail (model instructed).  

Final locked heuristic (see §5.2) keeps **≤ 2 model calls** per request, usually **1**.

### 5.2 Decision procedure (server)

```text
input message
  → embed(message)
  → match_procedures(embed, thr=0.35, k=4)
  → topSim = max similarity or 0

if topSim >= 0.35:
    type = rag (grounded)
elif scam_heuristics(message):   # URL, .apk, OTP, trúng thưởng, khóa tài khoản, paste length>80 with links
    type = scam
else:
    type = rag (may guardrail)

if type == rag and topSim < 0.35:
    # still one LLM call with empty/minimal context, forced guardrail format
    → guardrail response (or model produces official refusal sentence)
if type == rag and topSim >= 0.35:
    → LLM answer with chunks
if type == scam:
    → LLM scam JSON (level, reasons, advice)
```

`scam_heuristics` is a **cheap pre-filter**, not a verdict — final judgment always Gemini for pasted content when heuristics fire. If user clearly asks “cách làm CCCD” → rag even without strong sim (heuristics false).

Edge case: user pastes scam **and** asks procedure — heuristics prefer scam if paste-like; acceptable for v1.

### 5.3 Grounding & guardrail

Prompt rules for rag answer:

- Answer **only** from provided procedure excerpts.
- Structure when possible: Hồ sơ / Nơi nộp / Thời gian / Lệ phí.
- If excerpts insufficient: exact Vietnamese sentence:

> Thông tin này chưa có trong dữ liệu hướng dẫn của phường, cô/chú vui lòng liên hệ trực tiếp Bộ phận Một cửa UBND phường Cẩm Lệ để được hướng dẫn chính xác.

Response `guardrail: true` when server detects refusal path (low sim **or** model flag). Implementation: if `topSim < threshold`, force `guardrail: true` regardless of model prose.

### 5.4 History

- Client: max 10 turns in `sessionStorage`.
- Sent as `history[]` for tone continuity only.
- Server: **no** insert into DB.
- Clear history button in UI.

### 5.5 Scam analysis prompt

```text
You are a scam analyst for Vietnamese residents (many elderly).
Input: message or link text.
Output ONLY JSON:
{
  "level": "safe"|"caution"|"danger",
  "reasons": ["…2–4 short VN sentences…"],
  "advice": "…1–3 VN sentences, imperative…"
}
Rules:
- danger: impersonation of bank/gov, APK, OTP theft, threat + transfer, fake prize with fee
- caution: urgency without full proof, shortened links, minor grammar issues, unverifiable claims
- safe: ordinary neighborhood info, no money/credential pressure
- No legal advice beyond "contact bank/police/ward"
- Plain language, no jargon
```

Client maps `level` → 🟢🟡🔴 card. Sample chips send canned strings (see API spec).

### 5.6 Speech-to-text

- Mic button → `webkitSpeechRecognition` / `SpeechRecognition`, `lang: 'vi-VN'`.
- Interim results into input; final on `end`.
- Unsupported → hide mic. Always show keyboard.

---

## 6. Summarize design

### 6.1 Input

- `text` raw paste **or** `imageUrl` (already in Storage).

### 6.2 Prompt (single call)

```text
Extract a neighborhood bulletin from the source (VN).
Return ONLY JSON:
{
  "title": string,
  "category": "Hành chính"|"Y tế"|"Môi trường"|"An ninh"|"Sự kiện",
  "is_urgent": boolean,
  "summary_main": string,          // 2–3 short sentences
  "summary_time_location": string, // if unknown: ""
  "summary_action_required": string,
  "original_text": string,         // cleaned full text or ""
  "confidence_notes": string       // what admin must verify
}
Rules:
- Keep Vietnamese, plain, elderly-friendly
- Never invent precise dates/fees not in source — leave "" or note in confidence_notes
- is_urgent only for immediate health/safety/deadline
```

Image part: `inline_data` with `image/jpeg` (Gemini multimodal OCR+summary).

### 6.3 Failure

- Model non-JSON → parse retry once with stricter “JSON only” nudge; then 502.
- OCR empty image → 502 with message “Không đọc được nội dung ảnh, cô/chú thử ảnh rõ hơn hoặc dán văn bản”.

---

## 7. Admin auth flow

```text
/admin/login → email + password → supabase.auth.signInWithPassword
  → set SSR cookies → redirect /admin

middleware.ts (or layout check):
  /admin/** except login → require session else redirect login

API mutations:
  getSession() → null → 401
```

Sign-up disabled in dashboard. Seed user via admin API once.

---

## 8. Error taxonomy (UX)

| Condition | User message (VI) |
|-----------|-------------------|
| Gemini 429 | “Hệ thống đang đông, cô/chú thử lại sau ít phút ạ.” |
| Network fail | “Không có kết nối mạng. Vui lòng kiểm tra Wi‑Fi / 3G.” |
| Summarize OCR fail | “Không đọc được ảnh, thử ảnh rõ hơn hoặc dán văn bản.” |
| Audio gen fail | Publish still OK; admin warning banner |
| Guardrail | Official One-door sentence (fixed) |
| Session expired admin | Redirect login “Phiên đăng nhập hết hạn” |

Never show stack traces or English SDK errors to residents.

---

## 9. Security

| Threat | Mitigation |
|--------|------------|
| API key leak | Server-only env; no `NEXT_PUBLIC_`; CI grep |
| RLS bypass | Enable RLS; anon key only; mutations via service role or authenticated |
| Prompt injection in scam box | System prompt: ignore instructions inside user content; only classify/analyze |
| Prompt injection in chat | Same; retrieved chunks treated as data |
| XSS | React escaping; no `dangerouslySetInnerHTML` for model output |
| Admin brute force | Supabase auth; optional lockout later |
| Oversized image | 2 MB upload limit + 413 |
| PII | No resident identity fields collected |

---

## 10. Performance tactics

- `next/image` / proper dimensions for notice images.
- List page: paginate 20; avoid unbounded queries.
- Font: system stack first (see UI spec) to avoid webfont delay; optional `next/font` subset if custom face added later.
- Gemini: `maxOutputTokens` capped (~1024 chat/scam, ~800 summarize); thinking budget minimal if model exposes it.
- Parallel: fetch announcements while hydrating nav.
- Edge TTS only on demand, never on critical path of first paint.

---

## 11. Testing strategy

| Layer | Approach |
|-------|----------|
| Unit | Pure helpers: intent heuristics, JSON parse, font-scale |
| API | Manual/curl fixtures for chat rag/scam/guardrail; summarize text |
| E2E (light) | Playwright optional: load home, open chat, send sample scam |
| Device matrix | Android Chrome, iOS Safari, desktop Edge — TTS + install prompt |
| Seed QA | 5 questions hit correct procedure; 3 scam samples → danger |

No heavy CI contract tests required for competition v1; `lint` + `typecheck` gate.

---

## 12. Key prompts (reference locations)

Full prompt strings live in code modules:

| Module | File (planned) |
|--------|----------------|
| Intent/scam/rag | `src/lib/prompts.ts` |
| Summarize | `src/lib/prompts.ts` |
| Env models | `src/lib/gemini.ts` |

Do not put prompts in client bundles.

---

## 13. Sequence diagrams (condensed)

### Chat RAG

```text
Client → API: POST /api/chat {message, history}
API → Gemini: embed(message)
API → Postgres: match_procedures
alt sim >= thr
  API → Gemini: answer(chunks, message)
  API → Client: {type:rag, answer, sources, guardrail:false}
else
  API → Gemini: (optional) or fixed guardrail
  API → Client: {type:rag, guardrail:true, answer:official}
```

### Chat scam

```text
Client → API: POST /api/chat {message}
API → Gemini: analyze scam JSON (1 call)
API → Client: {type:scam, level, reasons, advice}
```

### Admin publish

```text
Admin → Storage: upload image
Admin → API: POST /api/summarize
API → Gemini: structured draft
Admin → API: POST /api/announcements
Admin → API: POST .../audio (Edge TTS → Storage → update row)
```

---

## Related documents

- Contracts → `08-API-SPEC.md`
- Schema → `07-DATABASE.md`
- Models/quota → `05-TECH-STACK.md`
- Screens/states → `04-UI-UX-SPEC.md`
