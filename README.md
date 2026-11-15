# Tổ Mình Ơi

Ứng dụng dân cư cho Phường Cẩm Lệ, Đà Nẵng: bảng tin tổ dân phố và trợ lý
AI hỏi đáp. PWA miễn phí, giọng đọc tiếng Việt, thiết kế cho người lớn tuổi.

**Prod:** https://tominhoi.vercel.app

## Stack

Next.js 16 (App Router) · Supabase (Postgres + RLS) · Google Gemini · Vercel.
Chi tiết: `docs/05-TECH-STACK.md`.

## Chạy local

```bash
npm install
cp .env.example .env.local   # điền khoá vào đây (không commit)
npm run dev                  # http://localhost:3000
```

Chất lượng: `npm run lint` · `npm run typecheck`

## Seed dữ liệu (sau khi cấu hình env)

```bash
npm run seed:procedures
npm run seed:announcements
npm run embed:procedures    # embedding 768 chiều
npm run generate:audio      # MP3 giọng đọc (Edge TTS)
```

## Demo video

```bash
npm run demo:build   # cần clip demo-out/light/*.mp4 + audio/*.mp3 (xem scripts/build-demo-video.mjs)
```

Kết quả: `public/demo-to-minh-oi.mp4` (1920x1080, ~90s, có voice-over). File này nằm ngoài git — build lại khi cần.

## Tài liệu

Bộ docs `docs/01` → `docs/09` là nguồn chuẩn cho hành vi sản phẩm.
Luật cứng dành cho AI coding agent: `AGENTS.md`.
Bắt đầu từ `docs/01-PRD.md`, phase hiện tại trong `docs/09-IMPLEMENTATION-PLAN.md`.

## Cấu trúc

```
src/app        App Router — trang công khai, admin, API
src/components UI (BottomNav, ChatPanel, NoticeCard, ShareSheet…)
src/lib        Supabase, Gemini, RAG, helpers
scripts/       seed, embed, generate audio, kiểm tra intent
fonts/         Be Vietnam Pro .ttf (bắt buộc .ttf cho satori/OG card)
```
