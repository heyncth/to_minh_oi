# 04 · UI / UX Specification

**Product:** Tổ Mình Ơi  
**Document status:** Locked (v1)  
**Design source:** `design-taste-frontend` app direction — kind `community`, style **Accent ladder**, seed `384019287` (`.taste-skill/app/direction.json`).  
**Adaptations stated below:** civic blue hue (not dealt raspberry), elderly type floor 18px (overrides style body 14).

---

## 1. Design principles

1. **Read first, decorate never** — cards are information, not chrome.
2. **Two taps to value** — hear notice; ask or check.
3. **Large, high contrast, stable layout** — no hover-only info, no tiny targets.
4. **Accent ladder** — full brand hue only on small marks (active tab icon, primary button, urgent badge); pale tints carry areas.
5. **Vietnamese UI copy**; sentence case; no ALL-CAPS walls.

---

## 2. Design tokens

### 2.1 Color — civic blue ladder

| Token | Value | Role |
|-------|-------|------|
| `--ground` | `#f4f7fb` | Page ground (hue-tinted, per direction identity) |
| `--surface` | `#ffffff` | Cards, sheets |
| `--raised` | `#eef2f7` | Inset panels, chips ground |
| `--border` | `#d7dee8` | Card borders |
| `--rule` | `#e8edf3` | Dividers |
| `--control` | `#c5cedb` | Input borders |
| `--text` | `#0f172a` | Primary ink |
| `--muted` | `#4b5563` | Secondary (≥4.5:1 on surface) |
| `--accent` | `#0b5cab` | Full hue — buttons, active icon, links (small marks only) |
| `--accent-soft` | `#e8f1fb` | Active nav row, selected chip, tint cards |
| `--accent-track` | `#cfe3f7` | Progress / tracks |
| `--accent-ink` | `#083d75` | Text on accent-soft |
| `--positive` | `#15803d` | Safe 🟢 |
| `--negative` | `#c41e24` | Danger 🔴 / urgent |
| `--warning` | `#a16207` | Caution 🟡 |
| `--urgent-bg` | `#ffe4e6` | Khẩn cấp badge bg |
| `--urgent-ink` | `#9f1239` | Khẩn cấp badge text |

**Budget:** accent ≤ ~8% of pixels; mostly `accent-soft`. No violet/indigo. No gradients.

### 2.2 Type

| Token | Value |
|-------|-------|
| Family | `"DM Sans", "Inter", system-ui, "Segoe UI", sans-serif` (system fallback OK if webfont deferred) |
| Weights | 400 / 500 / 600 / 700 |

**Elderly scale (overrides dealt body 14px):**

| Role | Vừa (base) | Lớn | Rất lớn |
|------|------------|-----|---------|
| Body / card text | **18px** | 21px | 24px |
| Small / meta | 15px | 17px | 19px |
| Section heading | 20px | 23px | 26px |
| Page title | 26px | 28px | 30px |
| Banner slogan | 16px | 18px | 20px |
| Bottom nav label | 13px | 14px | 15px |

Scale via `html[data-font-scale="md|lg|xl"]` multiplying a `--font-base` custom property (1 → 1.15 → 1.3). Persist `localStorage` key `font-scale`.

Line-height body: 1.5. Measure ≤ ~40ch on phone for summaries.

### 2.3 Space & shape

| Token | Value |
|-------|-------|
| Page pad (phone) | 16px |
| Page pad (≥768) | 24px |
| Card gap | 12px |
| Card pad | 16px |
| Card radius | 8px |
| Control radius | 6px |
| Pill radius | 999px |
| Control min height | 48px (elderly) |
| Icon button | 48×48 |
| Bottom nav height | 64px + safe-area |
| Top bar | 56px |

### 2.4 Elevation

No drop shadows on resting cards (direction: tone step via border + surface).  
Shadow only on: bottom sheet, modal, install banner floating.

---

## 3. Shell & navigation

### 3.1 Public shell (phone)

```text
┌─────────────────────────────┐
│ Top bar 56px                │
│ [Tổ Mình Ơi]    [Aa] [☰?]  │  ← Aa = font scale popover
├─────────────────────────────┤
│                             │
│ Page content                │
│                             │
├─────────────────────────────┤
│ Bottom nav 64px             │
│  [SVG bulletin] Bảng tin · [SVG chat] Trợ lý │  ← 2 tabs only
└─────────────────────────────┘
```

- **Active tab:** icon + label in `--accent`, row bg `--accent-soft` (accent ladder: tint area, full hue on icon).
- **Inactive:** `--muted` text/icon.
- Admin entry: text link **“Tổ trưởng”** in top bar overflow or `/admin` — not a third tab.

### 3.2 Banner (home only)

Under top bar, full width, `--accent-soft` ground:

**“Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7”**

Allow **2 lines** at 16px if needed. Product name in top bar is the mark; slogan is support line.

### 3.3 Admin shell

Simple top bar: wordmark · title “Quản lý bảng tin” · user email · **Đăng xuất**.  
No bottom nav (or bottom nav hidden). List + editor as main pane.

---

## 4. Screens

### 4.1 Home — Bảng tin (`/`)

**States:** loading skeleton (3 cards) · loaded · empty (“Chưa có tin mới”) · error (retry).

**Structure:**

1. Banner slogan (FR-41).
2. **Category chips** (horizontal scroll): Tất cả · Hành chính · Y tế · Môi trường · An ninh · Sự kiện.  
   Selected: `--accent-soft` fill + `--accent-ink` text + 1.5px `--accent` border.
3. **Notice cards** (list):

```text
┌────────────────────────────────────────┐
│ [Khẩn cấp]                    12/11   │  ← urgent pill (negative), date muted
│ Tiêm chủng mở rộng cho trẻ em tháng 12│  ← 18–20px / 600
│                                        │
│ Tóm tắt: 2–3 sentences…                │  ← body 18
│ Thời gian & địa điểm: …                │
│ Người dân cần làm gì: …                │
│                                        │
│ [▶ Nghe thông báo] [Chia sẻ] [Xem nguyên văn ›] │  ← primary + ghost buttons
└────────────────────────────────────────┘
```

- Urgent card: optional 1.5px left border `--negative` **or** pill only (choose pill; avoid double signal clutter).
- Listen button: filled `--accent`, white text, min-height 48. States: idle / playing (“Dừng”) / paused (“Tiếp tục”) / hidden.
- Share button: ghost, label **“Chia sẻ”**, icon share SVG (no emoji). Tap → **custom bottom sheet** (`ShareSheet.tsx`): drag handle · title “Chia sẻ tin này” · close X · preview of share card PNG (`GET /api/announcements/:id/card?variant=share`) · link row `/bang-tin/:id` · full-width **“Tải ảnh chia sẻ”** (primary) + **“Sao chép liên kết”** (ghost, “Đã sao chép liên kết” 2 s). Backdrop click / Esc closes. Tokens only; z-index 60; safe-area bottom pad.
- Detail page `/bang-tin/:id` (deep link target for QR/Zalo): back link **“← Xem tất cả thông báo của tổ”** above NoticeCard → `/`.

### 4.2 Trợ lý (`/tro-ly`)

**States:** empty · thinking (3-dot) · streaming/answer · error · guardrail.

**Empty state (locked copy):**

```text
Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi!
```

Then:

```text
Gửi câu hỏi
[ Làm giấy khai sinh cần gì? ] [ Xác nhận cư trú ở đâu? ] …  (≥4 chips)

Thử mẫu lừa đảo
[ Mẫu 1: OTP khóa tài khoản ] [ Mẫu 2: Cài APK ] [ Mẫu 3: Trúng thưởng ]
```

Section labels: 14–15px `--muted` (not slogans). Chips: `--surface` + border, 48px min height, full width wrap or horizontal scroll.

**Composer (fixed above bottom nav):**

```text
┌──────────────────────────────────────────┐
│ [mic SVG] [ Nhập câu hỏi hoặc dán tin nhắn… ] [Gửi] │
└──────────────────────────────────────────┘
```

- Send: filled accent, 48px.
- Mic: 48px icon; hidden if unsupported.
- Optional **Xóa hội thoại** text button in header.

**User bubble:** right, `--accent-soft`, `--accent-ink`, radius 8.  
**Assistant bubble:** left, `--surface`, border, `--text`.

**RAG answer:** paragraphs; optional source line: `Nguồn: Đăng ký khai sinh · độ tương đồng 71%` (14px muted).  
**Guardrail:** same bubble, standard sentence; optional info icon.

**Scam result card** (inside assistant turn):

```text
┌─ ● NGUY HIỂM – DẤU HIỆU LỪA ĐẢO CAO ─┐  ← header bar: level color solid, white text
│ • Lý do 1…                              │
│ • Lý do 2…                              │
│ • Lý do 3…                              │
│ Bạn nên: …advice…                       │
└─────────────────────────────────────────┘
```

| level | Header color | Header text |
|-------|--------------|-------------|
| safe | `--positive` | An toàn / Thông tin thông thường |
| caution | `--warning` | Cần cảnh giác / Xác minh thêm |
| danger | `--negative` | NGUY HIỂM – DẤU HIỆU LỪA ĐẢO CAO |

Icons in UI are **inline SVG** (no unicode emoji): nav bulletin/chat, mic, play/pause, level dot, radio markers.

Reasons: bullets, 18px. Advice: semibold first line “Bạn nên:”.

### 4.3 Admin login (`/admin/login`)

Centered card, max-width 400. Email, password, **Đăng nhập**.  
No “Đăng ký”. Footer: note “Tài khoản do phường cấp”.

### 4.4 Admin list (`/admin`)

Table/list: title · category · status (Đã đăng / Ẩn) · updated · actions (Sửa / Ẩn / Hiện / Xóa / Nghe).  
Primary: **+ Tin mới**.

### 4.5 Admin editor (`/admin/new` or `/admin/:id`)

```text
Mode: (•) Dán văn bản   ( ) Tải ảnh
[textarea or file input]
[Phân tích bằng AI]     ← primary

— Draft (AI filled) —
Tiêu đề [..............]
Danh mục [select]  ☑ Khẩn cấp
Tóm tắt chính [textarea]
Thời gian & địa điểm [textarea]
Cần làm gì [textarea]
Nguyên văn [textarea collapsed]
Ghi chú kiểm tra: …

[☑ Đăng ngay]  [Lưu nháp]  [Tạo giọng đọc]
```

- Confidence notes: amber soft box `#fffbeb` / `--warning` text.
- Publish success: toast “Đã đăng tin”.
- Audio fail: warning toast; stay on page.

### 4.6 Font scale control

Top bar **Aa** → popover: Vừa · Lớn · Rất lớn (radio rows 48px). Immediate apply.

### 4.7 Install prompt

Bottom sheet above nav (once):  
**“Cài đặt Tổ Mình Ơi vào màn hình chính”**  
Buttons: **Cài đặt** · **Để sau**.  
Copy line optional: **“Một chạm quét mã – Cả tổ thông tin”** only on QR poster art, not required here.

---

## 5. Component inventory

| Component | Notes |
|-----------|-------|
| `BottomNav` | 2 items |
| `FontSizeToggle` | Aa popover |
| `NoticeCard` | 3 blocks + badges + actions |
| `ListenButton` | Dual TTS path |
| `CategoryChips` | Single select |
| `ChatComposer` | input + mic + send |
| `ChatBubble` | user/assistant |
| `ScamResultCard` | 3-level |
| `SuggestionChips` | rag + scam groups |
| `AdminNoticeForm` | draft fields |
| `Toast` | success/error/warn |
| `EmptyState` | per screen |
| `ErrorRetry` | network/API |

---

## 6. Interaction & feedback

| Action | Feedback |
|--------|----------|
| Tap chip | Immediate send; disable while pending |
| Send chat | User bubble instant; assistant “…” then content |
| Listen playing | Button label **Dừng**; icon pause |
| Publish | Toast + list refresh |
| 429 | Inline VI message, Retry button |
| Long press image | Browser default OK |

Focus rings: 2px solid `--accent` + 2px offset, always visible on keyboard.

---

## 7. Accessibility (AA target)

| Rule | Spec |
|------|------|
| Contrast text/surface | ≥ 4.5:1 body |
| Touch target | ≥ 48×48 |
| Base body | ≥ 18px |
| Language | `lang="vi"` on `<html>` |
| Images | alt = title or “Ảnh thông báo” |
| Chat | `role="log"` aria-live polite on message list |
| Icon-only buttons | `aria-label` VI (“Nghe thông báo”, “Gửi tin”) |
| Reduced motion | Respect `prefers-reduced-motion` (no parallax) |

---

## 8. Content examples (sample)

**Notice card (matches seed):**

- Title: Tiêm chủng mở rộng cho trẻ em tháng 12  
- Urgent: yes  
- Summary: Trạm Y tế phường tổ chức tiêm chủng mở rộng. Cha mẹ đưa con theo lịch tổ.  
- Time/place: 08:00–11:00 sáng; Trạm Y tế phường.  
- Action: Mang sổ tiêm, giấy khai sinh/CCCD; hoãn nếu sốt.

**Scam danger sample (OTP):**

- Reasons: Giả mạo ngân hàng; Tạo sợ hãi “khóa 24h”; Yêu cầu cài link lạ/đọc OTP.  
- Advice: Không cài, không đọc OTP; gọi số trên thẻ; báo công an nếu đã chuyển.

---

## 9. Desktop / tablet

- ≥768: content max-width 720 centered for resident pages (keeps line length sane).
- Bottom nav stays (elderly tablet) **or** top tabs — **decision: keep bottom nav** for consistency.
- Admin: list + side-by-side editor optional; form column max 640.

---

## 10. Brand copy placement (locked)

| Placement | Copy |
|-----------|------|
| App name | Tổ Mình Ơi |
| Home banner | Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7 |
| QR print | Một chạm quét mã – Cả tổ thông tin |
| Poster (print only) | Tin chuẩn tận tay – Nghe ngay giọng đọc – An tâm mỗi ngày |
| Thuyết minh (docs only) | Gắn kết từng hộ dân – Vững bước Cẩm Lệ số |
| Chat empty | Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi! |

### 10.1 Brand assets (14/11/2026)

| Asset | Path | Notes |
|-------|------|-------|
| PWA icon source | `public/icons/icon-{192,512}.png` | From `Mobile_app_icon_design_cccd9e0f_2K.jpg` (house + chat + waveform, civic blue); white border flood-filled to icon blue |
| Maskable | `public/icons/icon-512-maskable.png` | Glyph inset ~10% on icon blue |
| Apple touch | `public/icons/apple-touch-icon.png` | 180×180 |
| OG / share | `public/og.jpg` | 1200×670 — wired in `layout.tsx` `openGraph` + `twitter` |
| A5 QR standee (print template) | `public/print/a5-standee-qr.jpg` | 896×1200 — teal header + amber footer + white QR card; **template for A4 poster / other print** |
| Share card (dynamic) | `GET /api/announcements/:id/card` | `variant=og` 1200×630 (Zalo/Messenger preview) · `variant=share` 896×1200 (photo share). Civic blue ladder, Be Vietnam Pro (`fonts/`), QR → `/bang-tin/:id` |

Print template language: dark teal bar + amber band + cream ground + white rounded QR card + double-line corner frame. Slogan under QR stays locked.

---

## 11. Out of scope for UI

Dark mode (optional later), onboarding carousel, avatars, animations beyond press states, webfont blocking FCP.

---

## 12. Implementation notes

- Tokens as CSS variables on `:root` / `[data-font-scale]`.
- Direction JSON kept at `.taste-skill/app/direction.json` (project artifact).
- Lint/inspect gates run when UI code exists (`lint.mjs`, `inspect.mjs --app`); not applicable to docs-only milestone.
- Do not ship dealt raspberry `#b8336a` as primary — use civic blue ladder above.

---

## Related documents

- FR IDs → `01-PRD.md`
- Flows/states → `03-USER-FLOWS.md`
- Stack → `05-TECH-STACK.md`
