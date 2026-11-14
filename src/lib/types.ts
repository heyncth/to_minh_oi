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

export const CATEGORIES = [
  "Tất cả",
  "Hành chính",
  "Y tế",
  "Môi trường",
  "An ninh",
  "Sự kiện",
] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];
