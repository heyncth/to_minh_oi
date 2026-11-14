import { NextResponse } from "next/server";
import { listPublishedAnnouncements } from "@/lib/announcements";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") ?? undefined;
  const limitRaw = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20;

  try {
    const items = await listPublishedAnnouncements(category);
    return NextResponse.json({ items: items.slice(0, limit), nextCursor: null });
  } catch {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không tải được bảng tin. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
