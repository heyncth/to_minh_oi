import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** POST multipart/form-data: file → Storage announcements/images/… */
export async function POST(req: Request) {
  const { user, supabase } = await createAdminClient();
  if (!user || !supabase) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Phiên đăng nhập hết hạn." } },
      { status: 401 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Thiếu tệp ảnh." } },
      { status: 400 },
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: { code: "payload_too_large", message: "Ảnh lớn hơn 2 MB." } },
      { status: 413 },
    );
  }

  const mime = file.type || "image/jpeg";
  if (!ALLOWED.includes(mime)) {
    return NextResponse.json(
      { error: { code: "bad_request", message: "Chỉ nhận JPG, PNG hoặc WebP." } },
      { status: 400 },
    );
  }

  const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
  const path = `images/${user.id}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from("announcements").upload(path, buf, {
    contentType: mime,
    upsert: false,
  });
  if (error) {
    return NextResponse.json(
      { error: { code: "internal_error", message: "Không tải ảnh lên được." } },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("announcements").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
