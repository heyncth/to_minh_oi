import { cache } from "react";
import type { Announcement } from "@/lib/types";

const SELECT =
  "id,title,category,is_urgent,is_published,summary_main,summary_time_location,summary_action_required,original_text,original_image_url,audio_url,created_at,updated_at";

/** Public published announcement only (RLS-safe anon REST, no cookies). */
export const getPublishedAnnouncement = cache(
  async (id: string): Promise<Announcement | null> => {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!base || !key) return null;

    const qs = new URLSearchParams({
      id: `eq.${id}`,
      is_published: "eq.true",
      select: SELECT,
      limit: "1",
    });
    const res = await fetch(`${base}/rest/v1/announcements?${qs}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as Announcement[];
    return rows[0] ?? null;
  },
);

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "https://tominhoi.vercel.app")
  );
}
