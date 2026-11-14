import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

async function AdminHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function signOut() {
    "use server";
    const s = await createClient();
    await s.auth.signOut();
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <strong style={{ color: "var(--accent-ink)" }}>Tổ Mình Ơi</strong>
          <span style={{ marginLeft: 8, color: "var(--muted)" }}>Quản lý bảng tin</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: "var(--meta-size)", color: "var(--muted)" }}>
            {user?.email}
          </span>
          <form action={signOut}>
            <button type="submit" className="btn btn--ghost">
              Đăng xuất
            </button>
          </form>
        </div>
      </header>

      <div className="card">
        <p>Danh sách tin và trình soạn thảo sẽ có ở P3.</p>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: "var(--meta-size)" }}>
          Hiện tại đã xác minh đăng nhập thành công.
        </p>
      </div>

      <p style={{ marginTop: 16 }}>
        <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
          ← Về bảng tin
        </Link>
      </p>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense
      fallback={
        <div className="app-main">
          <div className="skeleton-card" aria-busy="true">
            <p style={{ color: "var(--muted)" }}>Đang tải…</p>
          </div>
        </div>
      }
    >
      <AdminHome />
    </Suspense>
  );
}
