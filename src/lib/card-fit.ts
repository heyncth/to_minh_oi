/**
 * Share-card fit: pick a font scale so the top block fills the space above
 * the QR row. Yoga (satori) cannot expose text measurement, so widths come
 * from the actual font files via opentype.js — real glyph advances, greedy
 * word wrap (CSS rules), exact satori line-height math (fontSize × ratio).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { parse, type Font } from "opentype.js";

type Weight = 400 | 500 | 700;
type Parts = { title: string; summary?: string | null; timeLine?: string | null };

const FONT_DIR = path.join(process.cwd(), "fonts");
const FILES: Record<Weight, string> = {
  400: "BeVietnamPro-Regular.ttf",
  500: "BeVietnamPro-SemiBold.ttf",
  700: "BeVietnamPro-Bold.ttf",
};

// shortcut: module-level cache, resets on cold start only
let fontsPromise: Promise<Record<Weight, Font>> | null = null;

function loadFitFonts() {
  if (!fontsPromise) {
    fontsPromise = (async () => {
      const out = {} as Record<Weight, Font>;
      for (const w of [400, 500, 700] as const) {
        const buf = await readFile(path.join(FONT_DIR, FILES[w]));
        out[w] = parse(
          buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
        );
      }
      return out;
    })();
  }
  return fontsPromise;
}

function advance(font: Font, text: string, fontSize: number): number {
  try {
    return font.getAdvanceWidth(text, fontSize);
  } catch {
    // unsupported GSUB lookup — per-glyph sum, slightly wide (safe side)
    let w = 0;
    for (const ch of text) {
      w += ((font.charToGlyph(ch).advanceWidth ?? 0) * fontSize) / font.unitsPerEm;
    }
    return w;
  }
}

/** Greedy word wrap; returns line count (CSS: trailing spaces don't count at breaks). */
export function wrapLines(
  font: Font,
  text: string,
  fontSize: number,
  width: number,
): number {
  const space = advance(font, " ", fontSize);
  let lines = 1;
  let cur = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const w = advance(font, word, fontSize);
    if (cur > 0 && cur + space + w > width) {
      lines += 1;
      cur = w;
    } else {
      cur += (cur > 0 ? space : 0) + w;
    }
  }
  return lines;
}

// card inner width: 896 − margins 48 − padding 72
const TEXT_W = 776;
const CHIP_H = 40;
const TITLE_MT = 16;
const RULE_H = 41; // 1px rule + 20px margins each side
const TL_MT = 16;
const QR_ROW_H = 254; // padding 40 + border 4 + QR box (190 img + 20 padding)
const GAP = 24;
/** Inner height: canvas 1200 − header 96 − margins 48 − padding 72, minus QR row and gap. */
export const FIT = 1200 - 96 - 48 - 72 - QR_ROW_H - GAP;

export async function topHeight(k: number, parts: Parts): Promise<number> {
  const fonts = await loadFitFonts();
  const t = 44 * k;
  const s = 26 * k;
  const l = 24 * k;
  let h = CHIP_H + TITLE_MT;
  h += Math.min(wrapLines(fonts[700], parts.title, t, TEXT_W), 3) * t * 1.25;
  h += RULE_H;
  if (parts.summary) h += wrapLines(fonts[400], parts.summary, s, TEXT_W) * s * 1.45;
  if (parts.timeLine) {
    h += TL_MT + Math.min(wrapLines(fonts[500], parts.timeLine, l, TEXT_W), 3) * l * 1.4;
  }
  return h;
}

/**
 * Largest scale in [0.7, 1.8] whose top block fits; 0.7 when even that
 * overflows (least-bad shrink). Linear scan — height is a step function of
 * the wrap points, not worth trusting a binary search over.
 */
export async function fitScale(parts: Parts): Promise<number> {
  for (let c = 1.8; c >= 0.7; c -= 0.01) {
    if ((await topHeight(c, parts)) <= FIT) return Math.round(c * 100) / 100;
  }
  return 0.7;
}
