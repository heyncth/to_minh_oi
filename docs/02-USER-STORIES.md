# 02 · User Stories & Acceptance Criteria

**Product:** Tổ Mình Ơi  
**Format:** As a… I want… so that… + AC (Given/When/Then)  
**Document status:** Locked (v1)

---

## Legend

- **P** = P1 Resident  
- **A** = P2 Admin  
- **Priority:** M (must demo), S (should), C (could)

---

## Epic 1 — Access & shell

### US-01 · Open via QR (M)

**As** P, **I want** to scan one QR and see the neighborhood app, **so that** I do not install from a store.

**AC-01.1** Given a phone with camera/Wi‑Fi, When I scan the competition QR, Then I land on Bảng tin within 2 s FCP on 4G.  
**AC-01.2** Given first visit, When the shell loads, Then I see app name **Tổ Mình Ơi** and banner **“Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7”**.  
**AC-01.3** Given supported browser, When install prompt available, Then I can dismiss “Cài đặt ứng dụng vào màn hình chính” and it stays dismissed after reload (`localStorage`).

### US-02 · Two-tab navigation (M)

**As** P, **I want** a simple bottom bar, **so that** I always know where I am.

**AC-02.1** Given any public page, Then bottom nav shows exactly **Bảng tin** and **Trợ lý** with icons + labels.  
**AC-02.2** Given I tap a tab, Then it becomes active state within one tap (no hamburger).

### US-03 · Font size (M)

**As** P with poor eyesight, **I want** bigger text, **so that** I can read notices.

**AC-03.1** Given control **Vừa / Lớn / Rất lớn**, When I pick a size, Then body text scales immediately app-wide.  
**AC-03.2** Given I chose **Rất lớn**, When I reload, Then size persists.  
**AC-03.3** Given base scale, Then primary body ≥ 18px.

---

## Epic 2 — Bảng tin

### US-04 · Browse notices (M)

**As** P, **I want** latest notices in clear cards, **so that** I catch important updates.

**AC-04.1** Given published notices, Then list shows newest first.  
**AC-04.2** Given urgent item, Then card shows **Khẩn cấp** badge.  
**AC-04.3** Given category chips, When I tap **Y tế**, Then only Y tế items show; **Tất cả** restores.  
**AC-04.4** Given a card, Then it shows blocks: tóm tắt · thời gian & địa điểm · cần làm gì.  
**AC-04.5** Given `original_text` or image, When I expand, Then I see original; collapse works.

### US-05 · Listen to notice (M)

**As** P, **I want** to hear the summary, **so that** I do not strain my eyes.

**AC-05.1** Given device with VN Web Speech voice, When I tap **Nghe thông báo**, Then speech starts from summary (inside gesture).  
**AC-05.2** Given no VN voice but `audio_url`, When I tap, Then MP3 plays.  
**AC-05.3** Given neither, Then listen control is hidden or disabled — text still readable.  
**AC-05.4** Given playback, When I tap pause/resume/read again, Then behavior matches label.  
**AC-05.5** Given I leave the page, Then speech cancels (no ghost audio).

---

## Epic 3 — Trợ lý chat

### US-06 · Ask procedure question (M)

**As** P, **I want** to ask “làm X cần gì?”, **so that** I prepare papers before going out.

**AC-06.1** Given on Trợ lý, When I send a procedure question, Then answer includes available fields among hồ sơ / nơi nộp / thời gian / lệ phí.  
**AC-06.2** Given answer with sources, Then UI can show procedure names used (trust cue).  
**AC-06.3** Given question outside corpus, Then fixed guardrail sentence to **Bộ phận Một cửa UBND phường Cẩm Lệ** (`guardrail: true`).

### US-07 · Suggested questions (M)

**As** P, **I want** ready-made questions, **so that** I try without typing.

**AC-07.1** Given empty chat, Then ≥4 procedure chips visible (e.g. khai sinh, cư trú…).  
**AC-07.2** Given I tap a chip, Then it sends as a user message and gets a reply.

### US-08 · Voice input (S)

**As** P who types slowly, **I want** to speak my question, **so that** chat is faster.

**AC-08.1** Given browser supports recognition, Then mic button exists, `lang=vi-VN`.  
**AC-08.2** Given I speak, Then text appears in input; I still tap Send.  
**AC-08.3** Given unsupported browser, Then mic hidden; text input works.

### US-09 · Scam check via chat (M)

**As** P, **I want** to paste a suspicious SMS/link and get a clear verdict, **so that** I do not get scammed.

**AC-09.1** Given I paste suspicious text and send, Then response `type=scam` with `level` ∈ {safe, caution, danger}.  
**AC-09.2** Given danger, Then red card + ≥2 reasons + actionable advice in plain Vietnamese.  
**AC-09.3** Given caution, Then amber card; safe → green card.  
**AC-09.4** Given prompt-injection text inside paste (“ignore previous…”), Then model still only classifies/analyzes — no tool misuse, no policy leak.

### US-10 · Sample scam chips (M)

**As** judge / P, **I want** one-tap samples, **so that** demo needs no typing.

**AC-10.1** Given empty or chat area, Then 3 sample chips labeled as sample lừa đảo.  
**AC-10.2** Given tap sample, Then chat sends sample body and shows 🔴 (typical) result card.

### US-11 · History scope (S)

**As** P, **I want** my last messages while I stay on the page, **so that** context feels continuous — **without** an account.

**AC-11.1** Given messages in session, Then `history[]` sent with next request (≤10).  
**AC-11.2** Given reload within session storage lifetime, Then history restores if implemented via `sessionStorage`.  
**AC-11.3** Given **Xóa hội thoại**, Then local history clears; server has nothing to delete.  
**AC-11.4** Then: no chat rows in database.

---

## Epic 4 — Admin

### US-12 · Login (M)

**As** A, **I want** to sign in with my seeded account, **so that** only I publish.

**AC-12.1** Given `/admin` without session, Then redirect login.  
**AC-12.2** Given valid credentials, Then session cookie set and `/admin` opens.  
**AC-12.3** Given public visitor, Then registration UI absent / sign-up fails (disabled in Supabase).

### US-13 · Draft from text (M)

**As** A, **I want** paste → structured draft, **so that** I do not retype.

**AC-13.1** Given paste mode + text + submit, Then form fills title, category, urgent, 3 summaries.  
**AC-13.2** Given AI note field, Then I see what to verify (giờ, địa điểm).  
**AC-13.3** Given I edit fields, Then edits win over AI before save.

### US-14 · Draft from photo (M)

**As** A, **I want** upload a photo of a notice, **so that** paper circulars become cards.

**AC-14.1** Given image ≤2 MB jpeg/png/webp, Then upload succeeds to Storage.  
**AC-14.2** Given summarize call, Then draft returns (or clear VI error if unreadable).  
**AC-14.3** Given huge/invalid file, Then reject with clear message.

### US-15 · Publish / edit / hide / delete (M)

**As** A, **I want** full control of my notices, **so that** mistakes can be fixed.

**AC-15.1** Given draft, When publish, Then public list includes it (`GET` published).  
**AC-15.2** Given published, When hide (`is_published=false`), Then public list omits it; admin still sees.  
**AC-15.3** Given any, When edit, Then updates persist.  
**AC-15.4** Given delete, Then row gone; public 404.  
**AC-15.5** Given no session, Then all mutations → 401.

### US-16 · Generate listen audio (S)

**As** A, **I want** iPhone-safe audio for my notice, **so that** elders on iOS hear it.

**AC-16.1** Given publish or button, When generate audio, Then `audio_url` set to MP3 in Storage.  
**AC-16.2** Given Edge TTS failure, Then publish still succeeds; warning shown.  
**AC-16.3** Given audio exists, Then resident listen path can use MP3 on no-vi-voice devices.

---

## Epic 5 — Content quality

### US-17 · Seed corpus ready (M)

**As** competitor, **I want** ≥6 notices and ≥12 procedures with embeddings, **so that** demo never looks empty.

**AC-17.1** Given seed script run, Then 6 announcements `is_published=true`.  
**AC-17.2** Given 12 procedures, Then `embedding` non-null, dim 768.  
**AC-17.3** Given 5 QA questions, Then top match sensible.  
**AC-17.4** Then content marked SAMPLE until ward verification.

---

## Traceability (quick)

| Story | PRD |
|-------|-----|
| US-01–03 | FR-01–04 |
| US-04–05 | FR-10–15 |
| US-06–11 | FR-20–28 |
| US-12–16 | FR-30–35 |
| US-17 | §7 checklist |

---

## Related documents

- Journeys → `03-USER-FLOWS.md`
- API AC side → `08-API-SPEC.md`
