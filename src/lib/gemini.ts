import { GoogleGenAI } from "@google/genai";

const EMBED_DIM = Number(process.env.GEMINI_EMBEDDING_DIM || "768");
const EMBED_MODEL = process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2";

/** Embed text → number[768]. Server-only (GEMINI_API_KEY). */
export async function embedText(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const ai = new GoogleGenAI({ apiKey });
  const result = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: text,
    config: { outputDimensionality: EMBED_DIM },
  });

  const values = result.embeddings?.[0]?.values;
  if (!values || values.length !== EMBED_DIM) {
    throw new Error(`embedding dim mismatch: got ${values?.length ?? 0}`);
  }
  return values;
}
