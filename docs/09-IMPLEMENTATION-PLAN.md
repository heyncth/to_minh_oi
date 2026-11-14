# 09 · Implementation Plan

**Product:** Tổ Mình Ơi  
**Competition deadline:** 30/11/2026  
**Plan baseline:** 14/11/2026 (**16 days** left)  
**Document status:** Locked (v1) — docs-only milestone complete; this plan drives code phases.

---

## 0. Ground rules

- Solo implementer + AI coding agent (see `../AGENTS.md`).
- Free tiers only.
- Every phase ends with demo-able increment.
- Vietnamese UI strings; English code/comments.
- Do not invent legal/fee data without verification (SAMPLE labels).

---

## 1. Phases overview

```text
P0 Foundation → P1 Shell+Brand → P2 Bulletin+TTS
→ P3 Admin publish → P4 Trợily RAG+Scam → P5 Polish+Deploy+Demo
```

| Phase | Days (suggested) | Depends on |
|-------|------------------|------------|
| P0 | 1 | — |
| P1 | 1–2 | P0 |
| P2 | 2–3 | P1 |
| P3 | 2 | P0–P2 |
| P4 | 3 | P0, P1 |
| P5 | 2–3 | P2–P4 |
| Buffer | 2 | — |

**Critical path:** P0 → P2 (listen path) → P4 (scam+RAG demo) → P5.  
Admin (P3) can parallel P4 after P0.

---

## 2. Phase tasks

### P0 — Foundation (day 1)

| # | Task | Done when |
|---|------|-----------|
| 0.1 | Supabase project; enable `vector` | Extension listed |
| 0.2 | Run DDL, RPC, RLS, trigger (`07-DATABASE.md`) | Tables exist; RLS on |
| 0.3 | Storage bucket `announcements` public | Bucket + public URL works |
| 0.4 | Disable public sign-up; create seeded admin | Login works; signup fails |
| 0.5 | Google AI Studio key; set env in Vercel/local | Key not in git |
| 0.6 | `create-next-app` TypeScript App Router scaffold; folder tree from PRD | `npm run dev` |
| 0.7 | Env sample `.env.example` | Copy-paste ready |
| 0.8 | Seed script skeleton `scripts/seed-procedures.ts` | Inserts 12 rows embedding=null |

### P1 — Shell, brand, a11y (day 2–3)

| # | Task | Done when |
|---|------|-----------|
| 1.1 | Design tokens CSS from `04-UI-UX-SPEC` | Vars match spec |
| 1.2 | `manifest.json` + icons 192/512 | Lighthouse installable |
| 1.3 | `BottomNav` 2 tabs + routes `/`, `/tro-ly` | Nav works |
| 1.4 | `FontSizeToggle` + localStorage | Persists |
| 1.5 | Home banner slogan (FR-41) | Visible |
| 1.6 | Admin login page + SSR session helper | 0.4 verified end-to-end |
| 1.7 | Install prompt dismissible | FR-01 |

### P2 — Bulletin + TTS (day 3–5)

| # | Task | Done when |
|---|------|-----------|
| 2.1 | `GET /api/announcements` + Home list + chips | Seed published rows show |
| 2.2 | `NoticeCard` 3 blocks + expand original | Matches seed sample |
| 2.3 | `ListenButton` Web Speech path | Android VN works |
| 2.4 | MP3 fallback `<audio>` | iOS path coded |
| 2.5 | Edge TTS helper + `POST .../audio` | One seed notice has `audio_url` |
| 2.6 | Generate MP3 for all seed notices | 6 audio files in Storage |
| 2.7 | Pause/restart/teardown speech | AC-05.4–05.5 |

### P3 — Admin publish (parallel after P0–P1)

| # | Task | Done when |
|---|------|-----------|
| 3.1 | Admin list + create/edit/hide/delete API | Curl 200/401 correct |
| 3.2 | Image upload client → Storage | ≤2 MB validated |
| 3.3 | `POST /api/summarize` + Gemini prompt | Draft fills form |
| 3.4 | Editor form + confidence notes | Publish flow works |
| 3.5 | Audio button + failure toast | AC-16.2 |

### P4 — Trợily (day 5–8)

| # | Task | Done when |
|---|------|-----------|
| 4.1 | Embed helper `gemini-embedding-2` @768 | Unit: returns 768 floats |
| 4.2 | Seed embeddings for 12 procedures | All non-null |
| 4.3 | `match_procedures` smoke tests | 5 QA questions hit |
| 4.4 | `POST /api/chat` intent+RAG+guardrail | AC-06.* |
| 4.5 | Scam branch + JSON schema parse | AC-09.* |
| 4.6 | Chat UI: bubbles, chips, samples, empty copy | Locked strings |
| 4.7 | history sessionStorage + clear | AC-11.* |
| 4.8 | Mic STT optional path | AC-08.* |
| 4.9 | 429 friendly error + retry | AC in US |

### P5 — Polish, deploy, demo (day 9–12 + buffer)

| # | Task | Done when |
|---|------|-----------|
| 5.1 | Seed 6 announcements + categories + urgent flags | PRD §7 |
| 5.2 | Lighthouse mobile: FCP < 2 s | Screenshot |
| 5.3 | Device matrix: Android Chrome, iOS Safari, desktop | Checklist green |
| 5.4 | Vercel production deploy + custom QR URL | QR scans |
| 5.5 | 90 s demo video (F1→F2→F3) | File ready |
| 5.6 | Verify SAMPLE procedures with One-door (or annotate) | Honesty box checked |
| 5.7 | Thuyết minh + poster using locked slogans | Print ready |
| 5.8 | Final `lint` / `typecheck` / no key leak grep | CI/local green |

---

## 3. Dependencies

```text
Supabase project ──┬── P0 DDL ── P2 list ── P5 seed polish
                   ├── P0 auth ── P3 admin
                   └── P0 storage ── P3 image ── P3 audio

Gemini key ────────┬── P3 summarize
                   └── P4 embed + chat

Edge TTS ────────── P2 audio (after announcements ids exist)

Design tokens ───── P1 before all UI polish
```

---

## 4. Definition of done (product)

- [ ] QR → Bảng tin < 2 s FCP  
- [ ] ≥6 notices published; listen works Android + iOS fallback  
- [ ] ≥12 procedures embedded; 5/5 QA questions sensible  
- [ ] Chat: RAG answer, guardrail, scam danger sample  
- [ ] Admin: login → photo/text → publish → hide  
- [ ] Font scale persists; 2-tab nav only  
- [ ] 0 VNĐ stack; keys server-only  
- [ ] Demo video + QR + slogans on cover  

---

## 5. Risk buffer

| Risk | Buffer action |
|------|----------------|
| iOS audio | Test day 4; regenerate MP3 voice NamMinh if needed |
| Gemini quota | Prefer flash-lite; cache nothing secret; demo at off-peak if possible |
| Embedding QA fail | Lower threshold to 0.30; add procedure synonyms |
| Time slip | Cut: mic STT, install prompt polish, desktop admin split view |

**Cut order if late:** (1) mic, (2) sources UI line, (3) install prompt, (4) category count chips → simple select.

---

## 6. Suggested calendar (16 days)

| Day | Focus |
|-----|-------|
| 1 (14/11) | P0 + start docs sign-off (this pack) |
| 2–3 | P1 shell |
| 4–6 | P2 bulletin+TTS |
| 5–7 | P3 admin (overlap) |
| 8–10 | P4 chat |
| 11–12 | Seed polish + QA |
| 13–14 | Deploy + device matrix + video |
| 15–16 | Buffer + print / thuyết minh |

---

## Related documents

- All specs in `docs/`
- Agent rules → `../AGENTS.md`
