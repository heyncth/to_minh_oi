import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseAnnouncementPatch } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const SELECT =
  "id,title,category,is_urgent,is_published,summary_main,summary_time_location,summary_action_required,original_text,original_image_url,audio_url,created_at,updated_at";

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;

  // Try public published first
  const anon = await createClient();
  const { data: pub } = await anon
    .from("announcements")
    .select(SELECT)
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (pub) return NextResponse.json(pub);

  // Admin may fetch draft by id
  const { user, supabase } = await createAdminClient();
  if (user && supabase) {
    const { data } = await supabase.from("announcements").select(SELECT).eq("id", id).maybeSingle();
    if (data) return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: { code: "not_found", message: "Không thấy tin này." } },
    { status: 404 },
  );
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase } = await createAdminClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = parseAnnouncementPatch(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: { code: "bad_request", message: parsed.error } },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("announcements")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không cập nhật được tin." } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Không thấy tin này." } },
      { status: 404 },
    );
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const { user, supabase } = await createAdminClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const { data, error } = await supabase
    .from("announcements")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không xóa được tin." } },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Không thấy tin này." } },
      { status: 404 },
    );
  }
  return new NextResponse(null, { status: 204 });
}
