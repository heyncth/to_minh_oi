# 08 · API Specification

**Product:** Tổ Mình Ơi  
**Style:** JSON over HTTPS, Next.js Route Handlers under `/api`  
**Document status:** Locked (v1)

---

## 1. Conventions

| Rule | Value |
|------|-------|
| Base URL | Same origin as app (e.g. `https://<vercel-app>.vercel.app`) |
| Content-Type | `application/json; charset=utf-8` (except file upload) |
| Auth (admin) | Supabase SSR session cookie (`sb-…` cookies) |
| Auth (public) | None for `GET` published data, `POST /api/chat` |
| Errors | `{ "error": { "code": string, "message": string } }` |
| Success | Resource-shaped object (no envelope) unless listed |
| Language | Error `message` shown to users: **Vietnamese**. Codes stable English snake_case |
| Timeouts | AI routes: 15 s upstream budget; app target UX < 5 s summarize |
| Rate limiting | Best-effort per-IP in-memory / Vercel-level; always handle Gemini `429` |

### Error codes

| code | HTTP | When |
|------|------|------|
| `bad_request` | 400 | Missing/invalid body |
| `unauthorized` | 401 | Admin route, no session |
| `forbidden` | 403 | Authenticated but not allowed (future) |
| `not_found` | 404 | Unknown id |
| `payload_too_large` | 413 | Image/text over limit |
| `rate_limited` | 429 | App or upstream quota |
| `upstream_error` | 502 | Gemini/Edge TTS failure |
| `internal_error` | 500 | Unexpected |

---

## 2. Endpoint summary

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/chat` | Public | Unified assistant: RAG **or** scam analysis (intent) |
| POST | `/api/summarize` | Admin | OCR/text → structured announcement draft |
| GET | `/api/announcements` | Public | List published announcements |
| POST | `/api/announcements` | Admin | Create (optional AI draft fields already filled) |
| GET | `/api/announcements/:id` | Public | One published announcement |
| GET | `/api/announcements/:id/card` | Public | Share card PNG (OG preview + image download) |
| PATCH | `/api/announcements/:id` | Admin | Update / publish / hide / edit |
| DELETE | `/api/announcements/:id` | Admin | Delete |
| POST | `/api/announcements/:id/audio` | Admin | Generate Edge TTS MP3 → `audio_url` |

Removed vs early draft: **`/api/scam-check`** — merged into `/api/chat`.

---

## 3. `POST /api/chat`

Unified Trợ lý tab. Server classifies intent, then runs RAG or scam pipeline.

### Request

```json
{
  "message": "Làm giấy khai sinh cần gì?",
  "history": [
    { "role": "user", "content": "…" },
    { "role": "assistant", "content": "…" }
  ]
}
```

| Field | Type | Required | Limits |
|-------|------|----------|--------|
| `message` | string | yes | 1–2000 chars, trimmed non-empty |
| `history` | array | no | max **10** items, each `content` ≤ 2000 chars; server may truncate older turns |

`history` is client-held (`sessionStorage` / React state). Server does **not** persist messages.

### Server pipeline

1. Validate body.
2. **Intent** (single Gemini call or cheap pre-step — see `06-TDD.md`):
   - `rag` — question about procedures/services
   - `scam` — user pasted SMS/Zalo/link/text to check, or asks “có lừa đảo không”
3. Branch:
   - **rag:** embed `message` → `match_procedures` → if top similarity < threshold → **guardrail** answer; else Gemini answer grounded in chunks.
   - **scam:** Gemini structured analysis → level + reasons + advice. No DB write.

### Response — RAG

```json
{
  "type": "rag",
  "answer": "Để đăng ký khai sinh, cô/chú cần chuẩn bị: …",
  "sources": [
    { "id": "uuid", "procedure_name": "Đăng ký khai sinh", "similarity": 0.71 }
  ],
  "guardrail": false
}
```

Guardrail example (`guardrail: true`, `sources: []` may be empty):

```json
{
  "type": "rag",
  "answer": "Thông tin này chưa có trong dữ liệu hướng dẫn của phường, cô/chú vui lòng liên hệ trực tiếp Bộ phận Một cửa UBND phường Cẩm Lệ để được hướng dẫn chính xác.",
  "sources": [],
  "guardrail": true
}
```

### Response — scam

```json
{
  "type": "scam",
  "level": "danger",
  "reasons": [
    "Tên miền giả mạo cơ quan nhà nước",
    "Yêu cầu cài file .apk lạ",
    "Tạo tâm lý hoảng sợ thúc ép chuyển tiền"
  ],
  "advice": "Không cài app, không đọc mã OTP. Gọi ngân hàng theo số in trên thẻ. Báo công an phường nếu đã chuyển tiền."
}
```

| `level` | Meaning | UI |
|---------|---------|-----|
| `safe` | Ordinary / low risk information | 🟢 green card |
| `caution` | Verify before acting | 🟡 amber card |
| `danger` | High-confidence scam indicators | 🔴 red card |

`reasons`: 2–4 plain-language Vietnamese sentences. `advice`: 1–3 sentences, imperative.

### Sample scam payloads (client constants)

Client may send canned samples on chip tap:

| id | Sample (abbrev.) | Expected `level` |
|----|------------------|------------------|
| `sample-otp` | “Ngân hàng: tài khoản sẽ khóa trong 24h. Cài ngay bit.ly/xxx và đọc OTP” | `danger` |
| `sample-apk` | “Chuyển hàng, cài file APK để xác nhận giao nhận” | `danger` |
| `sample-lottery` | “Chúc mừng bạn trúng thưởng 500 triệu, đóng phí 2% để nhận” | `danger` |

Expected levels are for demo UX, not hard assertions (model may return `caution` on borderline text).

### Errors

| Status | code | Case |
|--------|------|------|
| 400 | `bad_request` | empty message, history too long |
| 429 | `rate_limited` | local limit or Gemini 429 after retry |
| 502 | `upstream_error` | Gemini unavailable |
| 500 | `internal_error` | unexpected |

---

## 4. `POST /api/summarize` (Admin)

Turn pasted text **or** image into announcement draft fields.

### Request

```json
{
  "text": "…optional raw text…",
  "imageUrl": "https://…supabase…/announcements/images/….jpg"
}
```

- At least one of `text` or `imageUrl`.
- Image already uploaded to Storage by client **before** this call (simpler auth + size limits at upload).
- Max text: 20 000 chars. Max image: 2 MB (enforced at upload).

### Response

```json
{
  "title": "Tiêm chủng mở rộng cho trẻ em tháng 12",
  "category": "Y tế",
  "is_urgent": true,
  "summary_main": "…2–3 sentences…",
  "summary_time_location": "…",
  "summary_action_required": "…",
  "original_text": "…extracted or provided text…",
  "confidence_notes": "Kiểm tra lại giờ giấc và địa điểm trước khi đăng."
}
```

| Field | Rules |
|-------|-------|
| `category` | One of: `Hành chính`, `Y tế`, `Môi trường`, `An ninh`, `Sự kiện` |
| `is_urgent` | boolean; admin can flip before publish |
| `confidence_notes` | Optional; admin UI shows as checklist hint, not resident-facing |

### Errors

| Status | code |
|--------|------|
| 400 | `bad_request` |
| 401 | `unauthorized` |
| 413 | `payload_too_large` |
| 429 | `rate_limited` |
| 502 | `upstream_error` (OCR/model fail) |

---

## 5. Announcements CRUD

### 5.1 `GET /api/announcements`

Query:

| Param | Default | Notes |
|-------|---------|-------|
| `category` | all | exact match VN label |
| `limit` | 20 | max 50 |
| `cursor` | — | optional `created_at` + `id` composite (v1 may use offset) |

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "…",
      "category": "Y tế",
      "is_urgent": true,
      "summary_main": "…",
      "summary_time_location": "…",
      "summary_action_required": "…",
      "original_text": null,
      "original_image_url": null,
      "audio_url": "https://…/audio/uuid.mp3",
      "created_at": "2026-11-20T01:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

Public list **must not** return `is_published: false` rows (RLS enforces; API re-filters).

Optional: `includeOriginal: true` only when user expands — v1 may return `original_text` always (short) to simplify.

### 5.2 `GET /api/announcements/:id`

- Public: 200 if published; 404 otherwise (do not leak drafts).
- Admin with session: may fetch unpublished by id for editor.

### 5.3 `POST /api/announcements` (Admin)

```json
{
  "title": "…",
  "category": "Y tế",
  "is_urgent": false,
  "is_published": true,
  "summary_main": "…",
  "summary_time_location": "…",
  "summary_action_required": "…",
  "original_text": "…",
  "original_image_url": "…",
  "audio_url": null
}
```

Response: created row with `id`, `created_at`, `updated_at`.

If `is_published` true and `audio_url` null, client may fire `POST /:id/audio` next.

### 5.4 `PATCH /api/announcements/:id` (Admin)

Partial body. Allowed keys: any of the POST fields except `id`/`created_by`, plus:

- `is_published` — hide (`false`) / show (`true`)

Response: updated row.

### 5.5 `DELETE /api/announcements/:id` (Admin)

- 204 No Content on success.
- Orphan Storage objects (image/audio) cleaned best-effort; not blocking.

### Admin auth failures

All admin mutations without valid session → `401 unauthorized`.  
Client redirects to `/admin/login`.

### 5.6 `GET /api/announcements/:id/card`

Share card image (ImageResponse + QR → `/bang-tin/:id`). Serves both OG link preview and the "Chia sẻ" download from one URL.

- Query `variant`: `og` (default, 1200×630 landscape) · `share` (896×1200 portrait, standee-style).
- Public: 200 `image/png`; 404 `{error:{code:"not_found"}}` if not published.
- QR encodes absolute `/bang-tin/:id` URL (site base from `NEXT_PUBLIC_SITE_URL` / Vercel prod URL).
- Colors = design tokens (accent `#0b5cab` ladder); fonts Be Vietnam Pro TTF.
- Cache: `public, max-age=3600, s-maxage=86400`.

---

## 6. `POST /api/announcements/:id/audio` (Admin)

Generate Vietnamese MP3 via Edge TTS, upload to Storage, set `audio_url`.

### Request

```json
{ "voice": "vi-VN-HoaiMyNeural" }
```

`voice` optional; default `vi-VN-HoaiMyNeural`. Alt: `vi-VN-NamMinhNeural`.

### Response

```json
{
  "audio_url": "https://…/announcements/audio/{id}.mp3",
  "duration_seconds": 42,
  "bytes": 91234
}
```

### Errors

| Status | code | Case |
|--------|------|------|
| 401 | `unauthorized` | no session |
| 404 | `not_found` | unknown announcement |
| 409 | `conflict` | optional: audio already exists (client may skip) |
| 502 | `upstream_error` | Edge TTS failed after retries |

**Policy:** failure does not block publish. Admin sees warning “Chưa có giọng đọc dự phòng — người dùng iPhone có thể chỉ thấy nút đọc máy (Web Speech)” or no button if no vi voice.

---

## 7. Non-API client-only features

| Feature | Where |
|---------|-------|
| Font size Vừa/Lớn/Rất lớn | `localStorage` key e.g. `font-scale`, apply `html` class/`data` attr |
| Chat history | `sessionStorage` key e.g. `tro-ly-history` |
| PWA install prompt | `beforeinstallprompt` |
| Web Speech TTS/STT | Browser APIs, no server |
| Intent samples chips | Client constants → `POST /api/chat` |

---

## 8. Example happy-path sequences

### Resident asks procedure

```
POST /api/chat
{ "message": "Làm giấy khai sinh cần gì?", "history": [] }
→ 200 { "type": "rag", "answer": "…", "sources": [...], "guardrail": false }
```

### Resident pastes scam SMS

```
POST /api/chat
{ "message": "Bank: verify account now, install https://bit.ly/x to avoid lock", "history": [] }
→ 200 { "type": "scam", "level": "danger", "reasons": [...], "advice": "…" }
```

### Admin publishes from image

```
1. Session cookie present
2. Client uploads image → Storage → url
3. POST /api/summarize { "imageUrl": url } → draft fields
4. Admin edits → POST /api/announcements { …, "is_published": true }
5. POST /api/announcements/{id}/audio → audio_url
6. GET /api/announcements → list includes new item
```

---

## 9. Versioning

- No public `/v1` prefix for demo (same-origin app).
- Breaking changes only between competition milestones; document in `09-IMPLEMENTATION-PLAN.md`.

---

## Related documents

- Contract details / prompts → `06-TDD.md`
- Tables & RLS → `07-DATABASE.md`
- User acceptance → `02-USER-STORIES.md`
