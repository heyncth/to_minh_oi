import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import { getPublishedAnnouncement, siteUrl } from "@/lib/announcements";
import { fitScale, summarySize, titleSize, tlSize } from "@/lib/card-fit";
import { formatDate } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

// docs/04 tokens + card-only inks
const GROUND = "#f4f7fb";
const SURFACE = "#ffffff";
const BORDER = "#d7dee8";
const RULE = "#e8edf3";
const TEXT = "#0f172a";
const MUTED = "#4b5563";
const SUMMARY = "#334155";
const ACCENT = "#0b5cab";
const ACCENT_SOFT = "#e8f1fb";
const ACCENT_INK = "#083d75";
// card-only: QR frame needs more bite than the soft track color
const QR_BORDER = "#8ec1f0";
const URGENT_BG = "#ffe4e6";
const URGENT_INK = "#9f1239";

const FONT_DIR = path.join(process.cwd(), "fonts");
const ICON_PATH = path.join(process.cwd(), "public", "icons", "icon-512.png");

// shortcut: module-level cache, resets on cold start only
let fontsPromise: Promise<
  Array<{ name: string; data: ArrayBuffer; weight: 400 | 500 | 700; style: "normal" }>
> | null = null;

let iconPromise: Promise<string> | null = null;

// shortcut: module-level cache, resets on cold start only
const qrCache = new Map<string, string>();

function loadIcon() {
  if (!iconPromise) {
    iconPromise = readFile(ICON_PATH).then(
      (buf) => `data:image/png;base64,${buf.toString("base64")}`,
    );
  }
  return iconPromise;
}

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

function Wordmark({
  onAccent = false,
  icon,
}: {
  onAccent?: boolean;
  icon: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon}
        width={40}
        height={40}
        alt=""
        style={{ borderRadius: 10 }}
      />
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
  const icon = await loadIcon();

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
            <Wordmark icon={icon} />
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
    // Photo share — ground canvas, 96px header, framed white card, QR row.
    const qrKey = `${siteUrl()}/bang-tin/${id}`;
    let qrDataUrl = qrCache.get(qrKey);
    if (!qrDataUrl) {
      qrDataUrl = await QRCode.toDataURL(qrKey, {
        margin: 1,
        width: 480,
        errorCorrectionLevel: "M",
        color: { dark: ACCENT, light: SURFACE },
      });
      qrCache.set(qrKey, qrDataUrl);
    }
    const summary = item.summary_main;
    const timeLine = item.summary_time_location;

    // Fill leftover height: scale title/body until the top block meets the QR
    // row (space-between otherwise leaves a hole). QR stays fixed.
    const k = await fitScale({ title: item.title, summary, timeLine });

    body = (
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
            height: 96,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: ACCENT,
            padding: "0 48px",
          }}
        >
          <Wordmark onAccent icon={icon} />
          <div style={{ color: SURFACE, fontSize: 24 }}>
            {formatDate(item.created_at)}
          </div>
        </div>

        <div
          style={{
            flex: 1,
            margin: 24,
            padding: 36,
            background: SURFACE,
            border: `2px solid ${BORDER}`,
            borderRadius: 24,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minHeight: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {chips}

            <div
              style={{
                marginTop: 16,
                fontSize: titleSize(k),
                fontWeight: 700,
                color: TEXT,
                lineHeight: 1.18,
                display: "block",
                lineClamp: 3,
                overflow: "hidden",
              }}
            >
              {item.title}
            </div>

            <div
              style={{ height: 1, background: RULE, margin: "20px 0" }}
            />

            {summary && (
              <div
                style={{
                  fontSize: summarySize(k),
                  color: SUMMARY,
                  lineHeight: 1.45,
                  display: "block",
                }}
              >
                {summary}
              </div>
            )}

            {timeLine && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    background: ACCENT_SOFT,
                    color: ACCENT_INK,
                    borderRadius: 999,
                    padding: "6px 16px",
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  Thời gian &amp; Địa điểm
                </div>
                <div
                  style={{
                    fontSize: tlSize(k),
                    fontWeight: 400,
                    color: TEXT,
                    lineHeight: 1.4,
                    display: "block",
                    lineClamp: 4,
                    overflow: "hidden",
                  }}
                >
                  {timeLine}
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 24,
              background: ACCENT_SOFT,
              border: `2px solid ${QR_BORDER}`,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <div
              style={{
                background: SURFACE,
                padding: 10,
                borderRadius: 12,
                flexShrink: 0,
                display: "flex",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                width={190}
                height={190}
                alt="Mã QR trỏ tới thông báo"
              />
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: ACCENT_INK,
                  lineHeight: 1.3,
                  textWrap: "balance",
                }}
              >
                Quét mã để nghe giọng đọc &amp; xem chi tiết
              </div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 500,
                  color: TEXT,
                  lineHeight: 1.3,
                }}
              >
                Một chạm quét mã – Cả tổ thông tin
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
      // short edge cache — card layout ships often, stale PNGs confuse users
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
