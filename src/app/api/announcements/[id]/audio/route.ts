import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEFAULT_VOICE, synthesizeMp3 } from "@/lib/edge-tts";
import { bulletinSpeechText } from "@/lib/speech-text";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase } = await createAdminClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const { data: row, error: findErr } = await supabase
    .from("announcements")
    .select("id,summary_main,summary_time_location,summary_action_required,audio_url")
    .eq("id", id)
    .maybeSingle();

  if (findErr || !row) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Không thấy tin này." } },
      { status: 404 },
    );
  }

  const text = bulletinSpeechText(row);
  if (!text.trim()) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Tin này chưa có nội dung đọc." } },
      { status: 400 },
    );
  }

  try {
    const { audio, duration, bytes } = await synthesizeMp3(text, DEFAULT_VOICE);
    const path = `audio/${id}.mp3`;
    const { error: upErr } = await supabase.storage.from("announcements").upload(path, audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (upErr) throw new Error(upErr.message);

    const {
      data: { publicUrl },
    } = supabase.storage.from("announcements").getPublicUrl(path);

    const { error: updErr } = await supabase
      .from("announcements")
      .update({ audio_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (updErr) throw new Error(updErr.message);

    return NextResponse.json({ audio_url: publicUrl, duration_seconds: duration, bytes });
  } catch (e) {
    console.error("audio synth failed", e instanceof Error ? e.message : e);
    return NextResponse.json(
      {
        error: {
          code: "upstream_error",
          message:
            "Chưa tạo được giọng đọc dự phòng — người dùng iPhone có thể chỉ thấy nút đọc máy (Web Speech).",
        },
      },
      { status: 502 },
    );
  }
}
