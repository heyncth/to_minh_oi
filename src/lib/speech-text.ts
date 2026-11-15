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
