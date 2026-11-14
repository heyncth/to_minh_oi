import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/lib/types";

const SELECT =
  "id,title,category,is_urgent,is_published,summary_main,summary_time_location,summary_action_required,original_text,original_image_url,audio_url,created_at";

export async function listPublishedAnnouncements(category?: string): Promise<Announcement[]> {
  const supabase = await createClient();
  let q = supabase
    .from("announcements")
    .select(SELECT)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (category && category !== "Tất cả") {
    q = q.eq("category", category);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Announcement[];
}
