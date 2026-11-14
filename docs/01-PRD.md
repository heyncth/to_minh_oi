# 01 · Product Requirements Document (PRD)

**Product name:** Tổ Mình Ơi  
**Subtitle:** Trợ lý số Tổ dân phố Cẩm Lệ (Smart TDP Assistant — Cam Le)  
**Competition:** Hội thi Sản phẩm số, ĐMST, KHCN phường Cẩm Lệ — Nhóm “Cẩm Lệ số” 2026  
**Form:** Individual · **Platform:** Progressive Web App (installable) · **Budget:** 0 VNĐ  
**Document status:** Locked (v1)

---

## 1. Overview & objectives

### 1.1 Problem

Ward / neighborhood (Tổ dân phố) notices arrive in long Zalo messages and photo scans. Residents — especially older adults — struggle to:

1. Find the essential facts (what, when, where, what to bring).
2. Hear content read aloud in Vietnamese on their phone.
3. Look up ward administrative procedures without getting lost.
4. Spot impersonation scams (fake bank SMS, APK links, “urgent transfer”).

Content in group chats scrolls away. Small text and walls of words lose the audience that needs the information most.

### 1.2 Solution

**Tổ Mình Ơi** — a zero-download web app opened via one QR code (PWA install optional):

| Pillar | What it does |
|--------|----------------|
| **Bảng tin** | Structured bulletin cards (summary / time-place / action) + Vietnamese listen button |
| **Trợ lý** | One chat: procedure Q&A (RAG) **and** scam message/link check (AI intent routing) |
| **Admin** | Tổ trưởng pastes text or uploads a photo → AI drafts the 3-block notice → publish |

### 1.3 Success metrics (demo)

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 2 s on mid-range Android, 4G |
| Summarize 300-word text or 1 photo | < 5 s (model latency) |
| Elderly accessibility | Body ≥ 18px at base scale; high contrast; core actions ≤ 2 taps |
| TTS on judging devices | Android Chrome: Web Speech VN; iOS: MP3 fallback when no vi voice |
| Scam samples | 3 one-tap samples → visible 🟢🟡🔴 result |

### 1.4 In-scope / out-of-scope

**In:** public bulletin, unified assistant, admin publish pipeline, seeded procedures, seed announcements, PWA install prompt, font scale.  
**Out:** offline content, resident accounts, push notifications, multi-ward SaaS, payment, server-side chat history, native stores.

---

## 2. Personas

### P1 — Resident (End user, no login)

- **Profile:** Mixed ages, priority 45+; mid/low-end smartphones; Zalo-heavy; may have low digital confidence.
- **Jobs:** See latest neighborhood notices; listen instead of squinting; ask how to do a paper procedure; check a weird message before clicking.
- **Pain:** Walls of text; fear of scams; unclear where to go for paperwork.
- **Success:** Opens QR → understands app in 5 s → hears one notice → asks one question or checks one SMS.

### P2 — Tổ trưởng / Tổ Công nghệ số cộng đồng (Admin, login)

- **Profile:** Receives official-looking photos and long forwards from the ward; must re-broadcast clearly to residents.
- **Jobs:** Turn raw material into a clear notice fast; fix details; publish or hide; ensure listen works.
- **Pain:** Retyping; inconsistent formats; forgetting to include “what residents must bring”.
- **Success:** Upload/paste → AI draft → edit → publish in < 2 minutes.

---

## 3. Functional requirements

### 3.1 Platform & accessibility

| ID | Requirement |
|----|-------------|
| FR-01 | `manifest.json` + icons; dismissible “Add to Home Screen” prompt |
| FR-02 | Font scale control **Vừa / Lớn / Rất lớn** persisted in `localStorage` |
| FR-03 | Bottom nav **2 tabs**: **Bảng tin** · **Trợ lý** (admin not a resident tab) |
| FR-04 | Network required; friendly VI error if offline — no offline content cache |

### 3.2 Module A — Bảng tin (Smart bulletin)

| ID | Requirement |
|----|-------------|
| FR-10 | List newest-first; filter categories: Tất cả, Hành chính, Y tế, Môi trường, An ninh, Sự kiện |
| FR-11 | Badges: **Khẩn cấp** (`is_urgent`), optional **Quan trọng** |
| FR-12 | Each card fixed 3 blocks: (1) Tóm tắt chính (2) Thời gian & địa điểm (3) Người dân cần làm gì |
| FR-13 | Expandable **Xem nguyên văn / Ảnh gốc** when present |
| FR-14 | **Nghe thông báo** button: Web Speech VN if available, else pre-generated MP3 (`audio_url`), else hide |
| FR-15 | Controls: pause / resume / read again |

### 3.3 Module B — Trợ lý (unified assistant)

| ID | Requirement |
|----|-------------|
| FR-20 | Single chat surface: text input + optional mic (Web Speech Recognition `vi-VN`) |
| FR-21 | **Intent routing (server):** `rag` vs `scam` without user picking a mode |
| FR-22 | RAG: embed query → `match_procedures` → grounded answer with Hồ sơ / Nơi nộp / Thời gian / Lệ phí when available |
| FR-23 | **Guardrail:** outside corpus → fixed sentence directing to **Bộ phận Một cửa UBND phường Cẩm Lệ** |
| FR-24 | 4 suggested procedure questions as chips |
| FR-25 | Scam check: 🟢 safe / 🟡 caution / 🔴 danger + 2–4 plain reasons + advice |
| FR-26 | **3 sample scam chips** for one-touch judge demo |
| FR-27 | History: client `sessionStorage` only; send last ≤10 turns with each request; clear button; **no server persistence** |
| FR-28 | Empty state copy: **“Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi!”** |

### 3.4 Admin

| ID | Requirement |
|----|-------------|
| FR-30 | Email/password login (Supabase Auth). **Public sign-up disabled.** Single seeded admin |
| FR-31 | Create notice from **paste text OR image upload** (Storage → `/api/summarize`) |
| FR-32 | AI fills title, category, urgency, 3 summaries; admin preview/edit |
| FR-33 | Publish (`is_published`), **edit**, **delete**, **hide** |
| FR-34 | Optional **Generate audio** (Edge TTS → MP3 → `audio_url`); failure does not block publish |
| FR-35 | Session-protected `/admin/**` and all mutation APIs |

### 3.5 Brand

| ID | Requirement |
|----|-------------|
| FR-40 | App display name: **Tổ Mình Ơi** |
| FR-41 | Banner under logo: **“Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7”** |
| FR-42 | QR sticker line: **“Một chạm quét mã – Cả tổ thông tin”** |
| FR-43 | Poster long line (print only): **“Tin chuẩn tận tay – Nghe ngay giọng đọc – An tâm mỗi ngày”** |
| FR-44 | Competition cover line (docs only): **“Gắn kết từng hộ dân – Vững bước Cẩm Lệ số”** |

---

## 4. Non-functional requirements

### 4.1 Security & privacy

- Residents never provide CCCD, phone, VNeID password, or other identifiers.
- `GEMINI_API_KEY` and `SUPABASE_SECRET_KEY` server-only.
- RLS on all tables; admin mutations require auth session.
- Scam/chat prompts ignore instructions embedded in user pasted content (anti prompt-injection).

### 4.2 Cost

100% free tier: Vercel, Supabase, Gemini free, Edge TTS free (unofficial), Web Speech free. Target operating cost **0 VNĐ** for demo scale.

### 4.3 Reliability

- Handle Gemini `429` with ≤2 retries + friendly Vietnamese message.
- Edge TTS failure → publish still succeeds.
- Guardrail path must work even when embedding index empty (return official refusal).

### 4.4 Performance

- FCP < 2 s (Lighthouse mobile, 4G throttled).
- Chat first token UX target < 5 s typical on flash-lite free tier.

### 4.5 Compliance notes

- Sample procedure/notice content labeled **SAMPLE** until verified with ward One-door desk.
- Edge TTS: free unofficial use — acceptable for non-monetized competition demo; note in report if required.

---

## 5. Assumptions

| # | Assumption |
|---|------------|
| A1 | Admin operates in Vietnamese; UI copy Vietnamese; code/comments English |
| A2 | Single ward scope (Cẩm Lệ) for demo; data not multi-tenant |
| A3 | Judging devices have network; QR points to deployed Vercel URL |
| A4 | Seed data verified before public handout (see `07-DATABASE.md`) |
| A5 | “24/7” banner means service available anytime online — not a SLA under free-tier quota exhaustion |

---

## 6. Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Gemini free RPD exhaustion on demo day | Chat/summarize down | flash-lite; retry UI; pre-generate seed audio; avoid double calls |
| iOS no vi-VN system voice | Listen button dead | MP3 fallback required for seed + published notices |
| Edge TTS rate limit | No MP3 | Seed early; degrade to Web Speech only |
| Wrong sample legal content | Misleading residents | SAMPLE labels; official verification before live |
| Long banner slogan wraps poorly | Visual | 2-line layout allowed (see UI spec) |

---

## 7. Deliverables checklist (competition)

- [ ] Deployed URL + QR on cover sheet
- [ ] 6+ published announcements with listen path verified
- [ ] 12 procedures embedded and QA’d
- [ ] 3 scam samples produce 🔴 (or documented borderline)
- [ ] 90 s demo video: QR → hear notice → ask procedure → check scam
- [ ] Pitch deck / thuyết minh uses locked slogans (FR-41…44)

---

## Related documents

- Stories & AC → `02-USER-STORIES.md`
- Journeys → `03-USER-FLOWS.md`
- UI → `04-UI-UX-SPEC.md`
- Stack → `05-TECH-STACK.md`
- Design → `06-TDD.md`
- Data → `07-DATABASE.md`
- API → `08-API-SPEC.md`
- Plan → `09-IMPLEMENTATION-PLAN.md`
- Agent rules → `../AGENTS.md`
