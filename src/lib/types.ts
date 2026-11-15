import { CATEGORIES as DB_CATEGORIES } from "@/lib/validation";

export type Announcement = {
  id: string;
  title: string;
  category: string;
  is_urgent: boolean;
  is_published: boolean;
  summary_main: string;
  summary_time_location: string | null;
  summary_action_required: string | null;
  original_text: string | null;
  original_image_url: string | null;
  audio_url: string | null;
  created_at: string;
};

/** Filter chips: "Tất cả" + the five DB categories (validation.ts is the source of truth). */
export const CATEGORIES = ["Tất cả", ...DB_CATEGORIES] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];
