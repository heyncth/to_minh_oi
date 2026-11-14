import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createAdminClient } from "@/lib/supabase/server";
import { SUMMARIZE_PROMPT } from "@/lib/prompts";

type Body = { text?: string; imageUrl?: string };

function jsonFromModel(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no json");
  return JSON.parse(candidate.slice(start, end + 1));
}

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
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.slice(0, 2000) : "";

  if (!text.trim() && !imageUrl.trim()) {
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

    if (imageUrl.trim()) {
      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error("image fetch failed");
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length > 2 * 1024 * 1024) {
        return NextResponse.json(
          { error: { code: "payload_too_large", message: "Ảnh lớn hơn 2 MB." } },
          { status: 413 },
        );
      }
      const mime = imgRes.headers.get("content-type") || "image/jpeg";
      parts.push({ inlineData: { mimeType: mime, data: buf.toString("base64") } });
      parts.push({ text: "SOURCE is the image above (and text if any)." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
    const result = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts }],
      config: { maxOutputTokens: 1024 },
    });

    const raw = result.text ?? "";
    const parsed = jsonFromModel(raw) as Record<string, unknown>;

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
