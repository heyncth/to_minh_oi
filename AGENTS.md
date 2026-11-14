# AGENTS.md — Instructions for AI coding agents

**Project:** Tổ Mình Ơi — Smart neighborhood PWA for Phường Cẩm Lệ  
**Audience:** Generic AI coding agents (Claude Code, opencode, Cursor, etc.)  
**Repo state:** Specs in `docs/` are source of truth for product behavior.

---

## 1. What this product is

Zero-budget PWA: neighborhood bulletin + one AI chatbot (procedure RAG + scam check) + admin publish with Gemini. Vietnamese UI. Elderly-first. Stack: **Next.js App Router + Vercel + Supabase + Gemini**.

Read in order when starting work:

1. `docs/01-PRD.md`
2. `docs/05-TECH-STACK.md`
3. `docs/06-TDD.md`
4. `docs/07-DATABASE.md` / `docs/08-API-SPEC.md`
5. `docs/04-UI-UX-SPEC.md` (tokens + screens)
6. `docs/09-IMPLEMENTATION-PLAN.md` (current phase)

---

## 2. Commands

```bash
# install
npm install

# dev
npm run dev

# quality gates (run before finishing any task)
npm run lint
npm run typecheck
# if test script exists:
npm test

# seed (after env configured) — adjust path to match scaffold
npm run seed:procedures
npm run seed:announcements
```

If a script is missing, add it to `package.json` rather than inventing ad-hoc one-offs.

---

## 3. Hard rules (never break)

1. **No secrets in client code.** `GEMINI_API_KEY`, `SUPABASE_SECRET_KEY` only in server env. No `NEXT_PUBLIC_` prefix on them. Never log them. Publishable key = `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_…`).
2. **No public sign-up.** Admin = one seeded account. Do not enable Supabase email signup UI.
3. **RLS stays on.** Public reads only `announcements.is_published = true` and active procedures.
4. **Chat is stateless on server.** Do not add a `messages` table or persist conversations. History lives in client `sessionStorage` and is sent as `history[]`.
5. **One chat endpoint.** Scam check is **not** a separate `/api/scam-check`. Use `POST /api/chat` with `type: rag | scam` (see API spec).
6. **Two bottom tabs only:** Bảng tin · Trợ lý. Do not add a third resident tab.
7. **Models pinned:** `GEMINI_MODEL=gemini-3.5-flash-lite`, `GEMINI_EMBEDDING_MODEL=gemini-embedding-2`, dim **768**. Do not switch to `gemini-2.5-flash` for new code.
8. **Guardrail sentence** (exact):  
   `Thông tin này chưa có trong dữ liệu hướng dẫn của phường, cô/chú vui lòng liên hệ trực tiếp Bộ phận Một cửa UBND phường Cẩm Lệ để được hướng dẫn chính xác.`
9. **Slogans locked** (do not paraphrase in UI):

   | Where | Copy |
   |-------|------|
   | App name | Tổ Mình Ơi |
   | Home banner | Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7 |
   | QR print | Một chạm quét mã – Cả tổ thông tin |
   | Poster print only | Tin chuẩn tận tay – Nghe ngay giọng đọc – An tâm mỗi ngày |
   | Thuyết minh only | Gắn kết từng hộ dân – Vững bước Cẩm Lệ số |
   | Chat empty | Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi! |

10. **SAMPLE data** in `docs/07-DATABASE.md` must stay labeled until verified with the ward. Do not silently invent fees/deadlines.
11. **No offline content cache.** Network required. Do not add a service worker that caches API responses.
12. **TTS:** Web Speech primary + pre-generated Edge TTS MP3 fallback (`vi-VN-HoaiMyNeural`). Do not call paid TTS APIs at runtime.

---

## 4. Conventions

| Topic | Rule |
|-------|------|
| Language | UI strings Vietnamese; code identifiers/comments English |
| Files | App Router under `src/app/`; components `src/components/`; libs `src/lib/`; scripts `scripts/` |
| Styling | CSS variables from `docs/04-UI-UX-SPEC.md`; no random hex in components |
| Font scale | `data-font-scale` on `<html>`; key `font-scale` in localStorage |
| Errors to users | Vietnamese, no stack traces, no English SDK messages |
| API errors | Shape `{ error: { code, message } }` — codes from API spec |
| Categories | Exactly: `Hành chính`, `Y tế`, `Môi trường`, `An ninh`, `Sự kiện` |
| Scam levels | `safe` \| `caution` \| `danger` → red/amber/green SVG level dot |
| DB uuid | `gen_random_uuid()` |
| Timestamps | `timestamptz` UTC |

---

## 5. Doc ↔ code map

When you change behavior, update the matching doc in the same PR/commit:

| Change | Update |
|--------|--------|
| New/changed FR | `docs/01-PRD.md` + stories if user-facing |
| New endpoint or body | `docs/08-API-SPEC.md` |
| Schema/RPC/RLS | `docs/07-DATABASE.md` |
| Model/env/architecture | `docs/05-TECH-STACK.md`, `docs/06-TDD.md` |
| Screen, token, copy | `docs/04-UI-UX-SPEC.md` |
| Phase/task shift | `docs/09-IMPLEMENTATION-PLAN.md` |

---

## 6. Working agreements

- Prefer smallest diff that satisfies the spec.
- Run `npm run lint` and `npm run typecheck` before saying a task is done.
- For non-trivial logic (intent heuristics, JSON parse, TTS state), leave a tiny test or assert-based check.
- Do not redesign tokens or slogans “for taste” — specs are locked.
- If a spec conflicts with reality (model renamed, Supabase UI changed), **stop and ask the user**; then patch both code and doc.
- Never commit secrets, `.env` values, or real admin passwords. Use `.env.example` placeholders only.

---

## 7. Current milestone

Docs pack v1 is complete under `docs/` + this file.  
Next engineering milestone = **P0–P1** in `docs/09-IMPLEMENTATION-PLAN.md`.

Out of scope unless user asks: native app stores, offline mode, resident accounts, multi-tenant, paid services.

---

## 8. Quick verification checklist

```text
[ ] lint + typecheck green
[ ] no GEMINI / service key in client bundle
[ ] /api/announcements public never returns is_published=false
[ ] chat: rag + scam + guardrail paths work
[ ] 3 sample scams render danger/caution/safe cards
[ ] listen: Web Speech OR MP3 OR hidden
[ ] font-scale persists
[ ] only 2 bottom tabs
[ ] slogans match table above
```
