/**
 * Generate Edge TTS MP3 for every published announcement missing audio_url.
 * Run: npx tsx scripts/generate-audio.ts
 * Uses SUPABASE_SECRET_KEY + public bucket announcements.
 */
import { createClient } from "@supabase/supabase-js";
import { bulletinSpeechText, DEFAULT_VOICE, synthesizeMp3 } from "../src/lib/edge-tts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

async function main() {
  const { data: rows, error } = await supabase
    .from("announcements")
    .select("id,title,summary_main,summary_time_location,summary_action_required,audio_url")
    .eq("is_published", true);
  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const row of rows ?? []) {
    if (row.audio_url) {
      skip += 1;
      console.log(`skip (has audio): ${row.title}`);
      continue;
    }
    const text = bulletinSpeechText(row);
    try {
      const { audio, duration, bytes } = await synthesizeMp3(text, DEFAULT_VOICE);
      const path = `audio/${row.id}.mp3`;
      const { error: up } = await supabase.storage.from("announcements").upload(path, audio, {
        contentType: "audio/mpeg",
        upsert: true,
      });
      if (up) throw new Error(up.message);
      const {
        data: { publicUrl },
      } = supabase.storage.from("announcements").getPublicUrl(path);
      const { error: upd } = await supabase
        .from("announcements")
        .update({ audio_url: publicUrl })
        .eq("id", row.id);
      if (upd) throw new Error(upd.message);
      ok += 1;
      console.log(`ok: ${row.title} (${duration}s, ${bytes}B)`);
    } catch (e) {
      fail += 1;
      console.error(`fail: ${row.title}: ${e instanceof Error ? e.message : e}`);
    }
  }

  console.log(`done: ${ok} generated, ${skip} skipped, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
