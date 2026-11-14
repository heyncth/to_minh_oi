/**
 * Embed all active procedures with null embedding → gemini-embedding-2 @768.
 * Run: npx tsx scripts/embed-procedures.ts
 */
import { createClient } from "@supabase/supabase-js";
import { embedText } from "../src/lib/gemini";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

async function main() {
  const { data: rows, error } = await supabase
    .from("admin_procedures")
    .select("id,procedure_name,content,embedding")
    .eq("is_active", true);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of rows ?? []) {
    if (row.embedding) {
      skip += 1;
      continue;
    }
    try {
      const text = `${row.procedure_name}\n${row.content}`;
      const emb = await embedText(text);
      const { error: upd } = await supabase
        .from("admin_procedures")
        .update({ embedding: emb })
        .eq("id", row.id);
      if (upd) throw new Error(upd.message);
      ok += 1;
      console.log(`ok: ${row.procedure_name} (dim=${emb.length})`);
    } catch (e) {
      fail += 1;
      console.error(`fail: ${row.procedure_name}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`done: ${ok} embedded, ${skip} skipped, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
