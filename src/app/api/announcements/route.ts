import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseAnnouncement } from "@/lib/validation";

const SELECT =
  "id,title,category,is_urgent,is_published,summary_main,summary_time_location,summary_action_required,original_text,original_image_url,audio_url,created_at,updated_at";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;
  const all = searchParams.get("all") === "1";

  try {
    // Admin with session can list drafts via ?all=1; public always published-only.
    let items: unknown[] = [];
    if (all) {
      const { user, supabase } = await createAdminClient();
      if (!user || !supabase) {
        return NextResponse.json(
          { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
          { status: 401 },
        );
      }
      let q = supabase.from("announcements").select(SELECT).order("created_at", { ascending: false }).limit(50);
      if (category && category !== "Tất cả") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      items = data ?? [];
    } else {
      const supabase = await createClient();
      let q = supabase
        .from("announcements")
        .select(SELECT)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);
      if (category && category !== "Tất cả") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      items = data ?? [];
    }

    return NextResponse.json({ items: items.slice(0, limit), nextCursor: null });
  } catch {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không tải được bảng tin. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const { user, supabase } = await createAdminClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = parseAnnouncement(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: "bad_request", message: parsed.error } },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("announcements")
    .insert({ ...parsed.data, created_by: user.id })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không tạo được tin." } },
      { status: 500 },
    );
  }
  return NextResponse.json(data, { status: 201 });
}
