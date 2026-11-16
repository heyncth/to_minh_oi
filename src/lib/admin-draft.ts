/** Shared admin draft state between /admin/new (step 1) and /admin/draft (step 2). */

export type AdminDraft = {
  title: string;
  category: string;
  is_urgent: boolean;
  is_published: boolean;
  summary_main: string;
  summary_time_location: string;
  summary_action_required: string;
  original_text: string;
  original_image_url: string[] | null;
  confidence_notes: string;
};

export const EMPTY_DRAFT: AdminDraft = {
  title: "",
  category: "Hành chính",
  is_urgent: false,
  is_published: true,
  summary_main: "",
  summary_time_location: "",
  summary_action_required: "",
  original_text: "",
  original_image_url: null,
  confidence_notes: "",
};

export const ADMIN_DRAFT_KEY = "admin-draft";
export const ADMIN_RAW_KEY = "admin-raw";

export function saveAdminDraft(d: AdminDraft) {
  try {
    sessionStorage.setItem(ADMIN_DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* quota — ignore */
  }
}

export function loadAdminDraft(): AdminDraft | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminDraft;
    return parsed && typeof parsed === "object" && "title" in parsed ? parsed : null;
  } catch {
    return null;
  }
}

export function clearAdminDraft() {
  try {
    sessionStorage.removeItem(ADMIN_DRAFT_KEY);
    sessionStorage.removeItem(ADMIN_RAW_KEY);
  } catch {
    /* ignore */
  }
}

export function saveAdminRaw(text: string) {
  try {
    sessionStorage.setItem(ADMIN_RAW_KEY, text);
  } catch {
    /* ignore */
  }
}

export function loadAdminRaw(): string {
  try {
    return sessionStorage.getItem(ADMIN_RAW_KEY) ?? "";
  } catch {
    return "";
  }
}
