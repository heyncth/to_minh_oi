import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { getPublishedAnnouncement, siteUrl } from "@/lib/announcements";

type Params = { params: Promise<{ id: string }> };

// Tokens from docs/04-UI-UX-SPEC.md — no random hex.
const GROUND = "#f4f7fb";
const SURFACE = "#ffffff";
const RAISED = "#eef2f7";
const BORDER = "#d7dee8";
const TEXT = "#0f172a";
const MUTED = "#4b5563";
const ACCENT = "#0b5cab";
const ACCENT_SOFT = "#e8f1fb";
const ACCENT_INK = "#083d75";
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

function Chip({ label, bg, fg, border }: { label: string; bg: string; fg: string; border?: string }) {
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: border ? `2px solid ${border}` : "none",
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

  const detailUrl = `${siteUrl()}/bang-tin/${id}`;
  const qrDataUrl = await QRCode.toDataURL(detailUrl, {
    margin: 1,
    width: variant === "share" ? 400 : 320,
    errorCorrectionLevel: "M",
    color: { dark: ACCENT, light: SURFACE },
  });

  const fonts = await loadFonts();
  const card = item;

  const chips = (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {card.is_urgent && (
        <Chip label="Khẩn cấp" bg={URGENT_BG} fg={URGENT_INK} />
      )}
      <Chip label={card.category} bg={RAISED} fg={MUTED} />
    </div>
  );

  const qrBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        background: SURFACE,
        border: `2px solid ${BORDER}`,
        borderRadius: 16,
        padding: variant === "share" ? "28px 36px" : "20px 24px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        width={variant === "share" ? 340 : 240}
        height={variant === "share" ? 340 : 240}
        alt="Mã QR trỏ tới thông báo"
      />
      <div
        style={{
          fontSize: variant === "share" ? 26 : 20,
          fontWeight: 700,
          color: ACCENT_INK,
          textAlign: "center",
        }}
      >
        Một chạm quét mã – Cả tổ thông tin
      </div>
    </div>
  );

  const body =
    variant === "share" ? (
      // Portrait card — standee-style, for photo share into groups
      <div
        style={{
          width,
          height,
          display: "flex",
          flexDirection: "column",
          background: GROUND,
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
          <div style={{ color: SURFACE, fontSize: 22, opacity: 0.9 }}>
            Bảng tin tổ dân phố
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, padding: "40px 48px", flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {chips}
            <div style={{ color: MUTED, fontSize: 22 }}>{formatDate(card.created_at)}</div>
          </div>

          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.title}
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: "flex", justifyContent: "center" }}>{qrBlock}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: ACCENT_SOFT,
            borderTop: `2px solid ${ACCENT}`,
            padding: "26px 48px",
          }}
        >
          <div style={{ color: ACCENT_INK, fontSize: 26, fontWeight: 500 }}>
            Trợ lý hỏi đáp 24/7
          </div>
        </div>
      </div>
    ) : (
      // Landscape OG — link preview in Zalo / Messenger
      <div
        style={{
          width,
          height,
          display: "flex",
          background: GROUND,
          fontFamily: "Be Vietnam Pro",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "44px 48px",
            gap: 24,
            borderRight: `2px solid ${BORDER}`,
          }}
        >
          <Wordmark />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {chips}
            <div style={{ color: MUTED, fontSize: 22 }}>{formatDate(card.created_at)}</div>
          </div>
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.3,
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {card.title}
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: ACCENT,
              }}
            />
            <div style={{ color: MUTED, fontSize: 20 }}>
              {`Trợ lý hỏi đáp 24/7 · ${siteUrl().replace(/^https?:\/\//, "")}`}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 440,
            background: ACCENT_SOFT,
            padding: 32,
          }}
        >
          {qrBlock}
        </div>
      </div>
    );

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
