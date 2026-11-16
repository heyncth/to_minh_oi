import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";
import { parseJsonObject } from "@/lib/intent";
import { SUMMARIZE_PROMPT } from "@/lib/prompts";

type Body = { text?: string; imageUrls?: string[] };

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// SSRF guard: only our own public Storage images, never arbitrary URLs.
const STORAGE_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/announcements/`;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: { code: "upstream_error", message: "Chưa cấu hình AI. Liên hệ quản trị viên." } },
      { status: 502 },
    );
  }

  const { user } = await createAdminClient();
  if (!user) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as Body | null;
  const text = typeof body?.text === "string" ? body.text.slice(0, 20_000) : "";
  const imageUrls = Array.isArray(body?.imageUrls)
    ? body.imageUrls.filter((u): u is string => typeof u === "string").slice(0, MAX_IMAGES)
    : [];

  if (!text.trim() && imageUrls.length === 0) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Cần dán văn bản hoặc tải ảnh thông báo." } },
      { status: 400 },
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: SUMMARIZE_PROMPT },
    ];

    if (text.trim()) {
      parts.push({ text: `SOURCE:\n${text}` });
    }

    for (const imageUrl of imageUrls) {
      if (!imageUrl.startsWith(STORAGE_PREFIX)) {
        return NextResponse.json(
          { error: { code: "bad_request", message: "Ảnh phải nằm trong thư viện ảnh của phường." } },
          { status: 400 },
        );
      }
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("image fetch failed");
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length > MAX_IMAGE_BYTES) {
        return NextResponse.json(
          { error: { code: "payload_too_large", message: "Ảnh lớn hơn 2 MB." } },
          { status: 413 },
        );
      }
      const mime = imgRes.headers.get("content-type") || "image/jpeg";
      parts.push({ inlineData: { mimeType: mime, data: buf.toString("base64") } });
    }
    if (imageUrls.length > 0) {
      parts.push({ text: "SOURCE includes the images above (and text if any)." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: { maxOutputTokens: 1024 },
    });

    const raw = result.text ?? "";
    const parsed = parseJsonObject(raw);

    return NextResponse.json({
      title: String(parsed.title ?? ""),
      category: String(parsed.category ?? "Hành chính"),
      is_urgent: Boolean(parsed.is_urgent),
      summary_main: String(parsed.summary_main ?? ""),
      summary_time_location: String(parsed.summary_time_location ?? ""),
      summary_action_required: String(parsed.summary_action_required ?? ""),
      original_text: String(parsed.original_text ?? text),
      confidence_notes: String(parsed.confidence_notes ?? ""),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json(
        {
          error: {
            code: "rate_limited",
            message: "Hệ thống đang đông, cô/chú thử lại sau ít phút ạ.",
          },
        },
        { status: 429 },
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "upstream_error",
          message: "Không phân tích được nội dung. Thử ảnh rõ hơn hoặc dán văn bản.",
        },
      },
      { status: 502 },
    );
  }
}
