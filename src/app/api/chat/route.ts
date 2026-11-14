import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/gemini";
import { parseJsonObject } from "@/lib/intent";
import { GUARDRAIL_SENTENCE, RAG_ANSWER_PROMPT, ROUTE_AND_SCAM_PROMPT } from "@/lib/prompts";

type HistoryItem = { role: "user" | "assistant"; content: string };
type Body = { message?: string; history?: HistoryItem[] };

// Real procedure hits ~0.70+; weak neighbors (scam/weather) land ~0.60–0.65.
const THRESHOLD = 0.70;
const MAX_HISTORY = 10;

function badRequest(message: string) {
  return NextResponse.json({ error: { code: "bad_request", message } }, { status: 400 });
}

function rateLimited() {
  return NextResponse.json(
    { error: { code: "rate_limited", message: "Hệ thống đang đông, cô/chú thử lại sau ít phút ạ." } },
    { status: 429 },
  );
}

function upstream(message: string) {
  return NextResponse.json({ error: { code: "upstream_error", message } }, { status: 502 });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message || message.length > 2000) {
    return badRequest("Cần nhập câu hỏi (tối đa 2000 ký tự).");
  }

  const history = Array.isArray(body?.history)
    ? body.history
        .filter(
          (h) =>
            h &&
            (h.role === "user" || h.role === "assistant") &&
            typeof h.content === "string",
        )
        .slice(-MAX_HISTORY)
        .map((h) => ({ role: h.role, content: h.content.slice(0, 2000) }))
    : [];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return upstream("Chưa cấu hình AI. Liên hệ quản trị viên.");

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const ai = new GoogleGenAI({ apiKey });

  try {
    // embed + retrieve (cheap, high RPD)
    let topSim = 0;
    let sources: { id: string; procedure_name: string; similarity: number }[] = [];
    let chunks: { procedure_name: string; content: string; similarity: number }[] = [];

    try {
      const qEmb = await embedText(message);
      const supabase = await createClient();
      const { data, error } = await supabase.rpc("match_procedures", {
        query_embedding: qEmb,
        match_threshold: 0,
        match_count: 4,
      });
      if (!error && data && data.length > 0) {
        const all = (data as {
          id: string;
          procedure_name: string;
          content: string;
          similarity: number;
        }[]).map((r) => ({
          id: r.id,
          procedure_name: r.procedure_name,
          content: r.content,
          similarity: Number(r.similarity),
        }));
        topSim = Math.max(...all.map((c) => c.similarity));
        const kept = all.filter((c) => c.similarity >= THRESHOLD);
        chunks = kept;
        sources = kept.map((c) => ({
          id: c.id,
          procedure_name: c.procedure_name,
          similarity: c.similarity,
        }));
      }
    } catch (e) {
      console.error("chat retrieve failed", e instanceof Error ? e.message : e);
      topSim = 0;
      sources = [];
      chunks = [];
    }

    // Strong RAG hit → grounded answer (1 Gemini call)
    if (topSim >= THRESHOLD && chunks.length > 0) {
      const context = chunks
        .map((c, i) => `[${i + 1}] ${c.procedure_name}\n${c.content}`)
        .join("\n\n");
      const historyText = history.length
        ? `\n\nConversation history (tone only):\n${history
            .map((h) => `${h.role}: ${h.content}`)
            .join("\n")}`
        : "";

      const result = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${RAG_ANSWER_PROMPT}\n\nProcedure excerpts:\n${context}${historyText}\n\nResident question: ${message}`,
              },
            ],
          },
        ],
        config: { maxOutputTokens: 1024 },
      });

      const answer = (result.text ?? "").trim() || GUARDRAIL_SENTENCE;
      // Guardrail → not a procedure answer; fall through to scam/route check.
      if (answer !== GUARDRAIL_SENTENCE) {
        return NextResponse.json({ type: "rag", answer, sources, guardrail: false });
      }
    }

    // No (useful) corpus hit → single Gemini call decides scam vs guardrail (no regex)
    const routeResult = await ai.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${ROUTE_AND_SCAM_PROMPT}\n\nINPUT:\n${message}` }],
        },
      ],
      config: { maxOutputTokens: 1024 },
    });

    const raw = routeResult.text ?? "";
    let parsed: Record<string, unknown>;
    try {
      parsed = parseJsonObject(raw);
    } catch {
      return NextResponse.json({
        type: "rag",
        answer: GUARDRAIL_SENTENCE,
        sources: [],
        guardrail: true,
      });
    }

    const intent = parsed.intent === "scam" ? "scam" : "rag";

    if (intent === "scam") {
      const level =
        parsed.level === "safe" || parsed.level === "caution" || parsed.level === "danger"
          ? parsed.level
          : "caution";
      const reasons = Array.isArray(parsed.reasons)
        ? parsed.reasons.map(String).slice(0, 4)
        : ["Không nhận diện chắc chắn dấu hiệu lừa đảo."];
      const advice =
        typeof parsed.advice === "string" && parsed.advice
          ? parsed.advice
          : "Không cài app lạ, không đọc OTP. Liên hệ ngân hàng hoặc công an nếu nghi ngờ.";
      return NextResponse.json({ type: "scam", level, reasons, advice });
    }

    return NextResponse.json({
      type: "rag",
      answer: GUARDRAIL_SENTENCE,
      sources: [],
      guardrail: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("chat error", msg, e instanceof Error ? e.stack : "");
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) return rateLimited();
    return upstream("Trợ lý đang gặp sự cố. Cô/chú thử lại sau ít phút ạ.");
  }
}
