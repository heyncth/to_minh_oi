"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Row = {
  id: string;
  title: string;
  category: string;
  is_urgent: boolean;
  is_published: boolean;
  updated_at: string;
  audio_url: string | null;
};

function fmt(iso: string) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function AdminListPage() {
  const router = useRouter();
  const [items, setItems] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/announcements?all=1");
      if (!alive) return;
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      const body = await res.json().catch(() => null);
      if (!alive) return;
      if (!res.ok) {
        setError(body?.error?.message ?? "Không tải được danh sách.");
        setItems([]);
        return;
      }
      setError(null);
      setItems(body.items as Row[]);
    })();
    return () => {
      alive = false;
    };
  }, [router, reloadKey]);

  async function patch(id: string, body: Record<string, unknown>, okMsg: string) {
    setBusy(id);
    setToast(null);
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Thao tác thất bại.");
      setToast(okMsg);
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Thao tác thất bại.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Xóa tin này? Không thể hoàn tác.")) return;
    setBusy(id);
    setToast(null);
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Không xóa được.");
      }
      setToast("Đã xóa tin");
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Không xóa được.");
    } finally {
      setBusy(null);
    }
  }

  async function makeAudio(id: string) {
    setBusy(id);
    setToast(null);
    try {
      const res = await fetch(`/api/announcements/${id}/audio`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error?.message ?? "Tạo giọng đọc thất bại.");
      setToast("Đã tạo giọng đọc");
      await load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Tạo giọng đọc thất bại.");
    } finally {
      setBusy(null);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
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
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/admin/new" className="btn btn--primary">
            + Tin mới
          </Link>
          <button type="button" className="btn btn--ghost" onClick={signOut}>
            Đăng xuất
          </button>
        </div>
      </header>

      {toast && (
        <div
          className="card"
          role="status"
          style={{ marginBottom: 12, borderColor: "var(--accent-track)", background: "var(--accent-soft)" }}
        >
          {toast}
        </div>
      )}
      {error && (
        <div className="card" role="alert" style={{ marginBottom: 12, borderColor: "var(--negative)" }}>
          <p style={{ color: "var(--negative)" }}>{error}</p>
          <button type="button" className="btn btn--ghost" style={{ marginTop: 8 }} onClick={() => void load()}>
            Thử lại
          </button>
        </div>
      )}

      {items === null && <div className="skeleton-card" aria-busy="true" />}

      {items?.length === 0 && (
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>Chưa có tin</p>
        </div>
      )}

      <ul style={{ listStyle: "none", display: "grid", gap: 10 }}>
        {items?.map((r) => (
          <li key={r.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontWeight: 600 }}>{r.title}</p>
                <p style={{ fontSize: "var(--meta-size)", color: "var(--muted)", marginTop: 4 }}>
                  {r.category}
                  {r.is_urgent ? " · Khẩn cấp" : ""} ·{" "}
                  <span style={{ color: r.is_published ? "var(--positive)" : "var(--warning)" }}>
                    {r.is_published ? "Đã đăng" : "Ẩn"}
                  </span>{" "}
                  · {fmt(r.updated_at)}
                  {r.audio_url ? " · có audio" : ""}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Link href={`/admin/${r.id}`} className="btn btn--ghost" style={{ minHeight: 40, padding: "0 12px" }}>
                  Sửa
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ minHeight: 40, padding: "0 12px" }}
                  disabled={busy === r.id}
                  onClick={() => patch(r.id, { is_published: !r.is_published }, r.is_published ? "Đã ẩn tin" : "Đã đăng tin")}
                >
                  {r.is_published ? "Ẩn" : "Hiện"}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ minHeight: 40, padding: "0 12px" }}
                  disabled={busy === r.id}
                  onClick={() => void makeAudio(r.id)}
                >
                  Nghe
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  style={{ minHeight: 40, padding: "0 12px", color: "var(--negative)" }}
                  disabled={busy === r.id}
                  onClick={() => void remove(r.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: 20 }}>
        <Link href="/" style={{ color: "var(--accent)", fontWeight: 600 }}>
          ← Về bảng tin
        </Link>
      </p>
    </div>
  );
}
