import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { getPublishedAnnouncement, siteUrl } from "@/lib/announcements";

type Params = { params: Promise<{ id: string }> };

// docs/04 tokens + card-only inks
const SURFACE = "#ffffff";
const RULE = "#e8edf3";
const TEXT = "#0f172a";
const MUTED = "#4b5563";
const SUMMARY = "#334155";
const ACCENT = "#0b5cab";
const ACCENT_SOFT = "#e8f1fb";
const ACCENT_INK = "#083d75";
const ACCENT_TRACK = "#cfe3f7";
const URGENT_BG = "#ffe4e6";
const URGENT_INK = "#9f1239";

const FONT_DIR = path.join(process.cwd(), "fonts");

// shortcut: module-level cache, resets on cold start only
let fontsPromise: Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 700; style: "normal" }>
> | null = null;

function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      (
        [
          ["BeVietnamPro-Regular.ttf", 400],
          ["BeVietnamPro-SemiBold.ttf", 500],
          ["BeVietnamPro-Bold.ttf", 700],
        ] as const
      ).map(async ([file, weight]) => {
        const data = await readFile(path.join(FONT_DIR, file));
        return {
          name: "Be Vietnam Pro",
          data: data.buffer.slice(
            data.byteOffset,
            data.byteOffset + data.byteLength,
          ) as ArrayBuffer,
          weight,
          style: "normal" as const,
        };
      }),
    );
  }
  return fontsPromise;
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <div
      style={{
        background: bg,
        color: fg,
        borderRadius: 999,
        padding: "6px 18px",
        fontSize: 22,
        fontWeight: 500,
      }}
    >
      {label}
    </div>
  );
}

function Wordmark({ onAccent = false }: { onAccent?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: onAccent ? SURFACE : ACCENT,
          color: onAccent ? ACCENT : SURFACE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        T
      </div>
      <div
        style={{
          color: onAccent ? SURFACE : ACCENT,
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        Tổ Mình Ơi
      </div>
    </div>
  );
}

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const item = await getPublishedAnnouncement(id);
  if (!item) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Không thấy tin này." } },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(req.url);
  const variant = searchParams.get("variant") === "share" ? "share" : "og";
  const width = variant === "share" ? 896 : 1200;
  const height = variant === "share" ? 1200 : 630;

  const fonts = await loadFonts();

  const chips = (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {item.is_urgent && <Chip label="Khẩn cấp" bg={URGENT_BG} fg={URGENT_INK} />}
      <Chip label={item.category} bg={ACCENT_SOFT} fg={ACCENT_INK} />
    </div>
  );

  let body;

  if (variant === "og") {
    // Link preview — white canvas, accent rail, big title. No QR.
    body = (
      <div
        style={{
          width,
          height,
          display: "flex",
          background: SURFACE,
          fontFamily: "Be Vietnam Pro",
        }}
      >
        <div style={{ width: 16, background: ACCENT, flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Wordmark />
            {chips}
          </div>

          <div
            style={{ flex: 1, display: "flex", alignItems: "center", minHeight: 0 }}
          >
            <div
              style={{
                fontSize: 54,
                fontWeight: 700,
                color: TEXT,
                lineHeight: 1.25,
                display: "block",
                lineClamp: 3,
                overflow: "hidden",
              }}
            >
              {item.title}
            </div>
          </div>

          <div style={{ fontSize: 24, color: MUTED }}>
            Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7
          </div>
        </div>
      </div>
    );
  } else {
    // Photo share — blue header, white body, one summary line, QR frame.
    const qrDataUrl = await QRCode.toDataURL(`${siteUrl()}/bang-tin/${id}`, {
      margin: 1,
      width: 480,
      errorCorrectionLevel: "M",
      color: { dark: ACCENT, light: SURFACE },
    });
    const summary = item.summary_main || item.summary_time_location;

    body = (
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          background: SURFACE,
          fontFamily: "Be Vietnam Pro",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: ACCENT,
            padding: "36px 48px",
          }}
        >
          <Wordmark onAccent />
          <div style={{ color: SURFACE, fontSize: 24 }}>
            {formatDate(item.created_at)}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 24,
            padding: "40px 48px",
            minHeight: 0,
          }}
        >
          {chips}

          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.3,
              display: "block",
              lineClamp: 3,
              overflow: "hidden",
            }}
          >
            {item.title}
          </div>

          <div style={{ height: 2, background: RULE }} />

          {summary && (
            <div
              style={{
                fontSize: 26,
                color: SUMMARY,
                lineHeight: 1.45,
                display: "block",
                lineClamp: 3,
                overflow: "hidden",
              }}
            >
              {summary}
            </div>
          )}

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                border: `2px solid ${ACCENT_TRACK}`,
                borderRadius: 20,
                padding: 20,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                width={240}
                height={240}
                alt="Mã QR trỏ tới thông báo"
              />
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: ACCENT,
                  textAlign: "center",
                }}
              >
                Quét mã để nghe giọng đọc &amp; xem chi tiết
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return new ImageResponse(body, {
    width,
    height,
    fonts,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
