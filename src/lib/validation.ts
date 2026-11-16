export const CATEGORIES = [
  "Hành chính",
  "Y tế",
  "Môi trường",
  "An ninh",
  "Sự kiện",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type AnnouncementInput = {
  title: string;
  category: Category;
  is_urgent: boolean;
  is_published: boolean;
  summary_main: string;
  summary_time_location: string | null;
  summary_action_required: string | null;
  original_text: string | null;
  original_image_url: string[] | null;
  audio_url: string | null;
};

const MAX_IMAGES = 5;

function str(v: unknown, max: number, fallback = ""): string {
  if (typeof v !== "string") return fallback;
  return v.slice(0, max);
}

function nullableStr(v: unknown, max: number): string | null {
  if (typeof v !== "string" || v.trim() === "") return null;
  return v.slice(0, max);
}

function imageUrls(v: unknown): string[] | null {
  if (!Array.isArray(v)) return null;
  const urls = v
    .filter((u): u is string => typeof u === "string" && u.trim() !== "")
    .map((u) => u.slice(0, 2000))
    .slice(0, MAX_IMAGES);
  return urls.length > 0 ? urls : null;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

export function parseAnnouncement(body: unknown): { ok: true; data: AnnouncementInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Thiếu dữ liệu tin." };
  }
  const b = body as Record<string, unknown>;
  const title = str(b.title, 300).trim();
  const summary_main = str(b.summary_main, 4000).trim();
  if (!title) return { ok: false, error: "Thiếu tiêu đề." };
  if (!summary_main) return { ok: false, error: "Thiếu tóm tắt chính." };

  const categoryRaw = str(b.category, 40);
  const category = (CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as Category)
    : "Hành chính";

  return {
    ok: true,
    data: {
      title,
      category,
      is_urgent: bool(b.is_urgent),
      is_published: bool(b.is_published),
      summary_main,
      summary_time_location: nullableStr(b.summary_time_location, 2000),
      summary_action_required: nullableStr(b.summary_action_required, 2000),
      original_text: nullableStr(b.original_text, 20000),
      original_image_url: imageUrls(b.original_image_url),
      audio_url: nullableStr(b.audio_url, 2000),
    },
  };
}

export function parseAnnouncementPatch(
  body: unknown,
): { ok: true; data: Partial<AnnouncementInput> } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Thiếu dữ liệu." };
  const b = body as Record<string, unknown>;
  const data: Partial<AnnouncementInput> = {};

  if (typeof b.title === "string") data.title = b.title.slice(0, 300);
  if (typeof b.category === "string" && (CATEGORIES as readonly string[]).includes(b.category)) {
    data.category = b.category as Category;
  }
  if (typeof b.is_urgent === "boolean") data.is_urgent = b.is_urgent;
  if (typeof b.is_published === "boolean") data.is_published = b.is_published;
  if (typeof b.summary_main === "string") data.summary_main = b.summary_main.slice(0, 4000);
  if ("summary_time_location" in b) data.summary_time_location = nullableStr(b.summary_time_location, 2000);
  if ("summary_action_required" in b) data.summary_action_required = nullableStr(b.summary_action_required, 2000);
  if ("original_text" in b) data.original_text = nullableStr(b.original_text, 20000);
  if ("original_image_url" in b) data.original_image_url = imageUrls(b.original_image_url);
  if ("audio_url" in b) data.audio_url = nullableStr(b.audio_url, 2000);

  if (Object.keys(data).length === 0) return { ok: false, error: "Không có trường nào để cập nhật." };
  return { ok: true, data };
}
