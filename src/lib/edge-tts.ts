import { EdgeTTS } from "@andresaya/edge-tts";

export const DEFAULT_VOICE = "vi-VN-HoaiMyNeural";

/** Synthesize Vietnamese speech → MP3 buffer. Best-effort; caller sets audio_url on success only. */
export async function synthesizeMp3(
  text: string,
  voice: string = DEFAULT_VOICE,
): Promise<{ audio: Buffer; duration: number; bytes: number }> {
  const tts = new EdgeTTS({ timeout: 30_000 });
  const result = await tts.generate(text, voice, {
    outputFormat: "audio-24khz-48kbitrate-mono-mp3",
  });
  const audio = Buffer.from(result.audio);
  if (audio.length === 0) throw new Error("Edge TTS returned empty audio");
  return {
    audio,
    duration: Math.round(result.duration || 0),
    bytes: audio.length,
  };
}

/** Speak text for a bulletin: title first, then labeled summary blocks. */
export function bulletinSpeechText(input: {
  title?: string | null;
  summary_main: string;
  summary_time_location?: string | null;
  summary_action_required?: string | null;
}): string {
  return [
    input.title ? input.title : "",
    input.summary_main ? `Tóm tắt: ${input.summary_main}` : "",
    input.summary_time_location
      ? `Thời gian và địa điểm: ${input.summary_time_location}`
      : "",
    input.summary_action_required
      ? `Người dân cần làm gì: ${input.summary_action_required}`
      : "",
  ]
    .filter(Boolean)
    .join(". ");
}
