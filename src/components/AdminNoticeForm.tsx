"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/validation";

type Draft = {
  title: string;
  category: string;
  is_urgent: boolean;
  is_published: boolean;
  summary_main: string;
  summary_time_location: string;
  summary_action_required: string;
  original_text: string;
  original_image_url: string | null;
  confidence_notes: string;
};

const EMPTY: Draft = {
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

export function AdminNoticeForm({ initialId }: { initialId?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "image">("text");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "analyze" | "save" | "audio" | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  async function analyze() {
    setBusy("analyze");
    setToast(null);
    setConfidence(null);
    try {
      let imageUrl: string | undefined;
      if (mode === "image") {
        if (!file) throw new Error("Chọn ảnh thông báo trước.");
        setBusy("upload");
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch("/api/upload", { method: "POST", body: fd });
        const upBody = await up.json().catch(() => null);
        if (!up.ok) throw new Error(upBody?.error?.message ?? "Tải ảnh thất bại.");
        imageUrl = upBody.url as string;
      }

      setBusy("analyze");
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "text" ? { text: rawText } : { imageUrl, text: rawText || undefined },
        ),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Phân tích thất bại.");

      setDraft({
        title: body.title || "",
        category: body.category || "Hành chính",
        is_urgent: Boolean(body.is_urgent),
        is_published: true,
        summary_main: body.summary_main || "",
        summary_time_location: body.summary_time_location || "",
        summary_action_required: body.summary_action_required || "",
        original_text: body.original_text || rawText,
        original_image_url: imageUrl ?? null,
        confidence_notes: body.confidence_notes || "",
      });
      setConfidence(body.confidence_notes || null);
      setToast({ kind: "ok", msg: "Đã tạo nháp từ AI — kiểm tra trước khi đăng." });
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Phân tích thất bại." });
    } finally {
      setBusy(null);
    }
  }

  async function save(publish: boolean) {
    if (!draft.title.trim() || !draft.summary_main.trim()) {
      setToast({ kind: "err", msg: "Cần tiêu đề và tóm tắt chính." });
      return;
    }
    setBusy("save");
    setToast(null);
    try {
      const payload = {
        ...draft,
        is_published: publish,
        summary_time_location: draft.summary_time_location || null,
        summary_action_required: draft.summary_action_required || null,
        original_text: draft.original_text || null,
        original_image_url: draft.original_image_url,
      };

      const res = initialId
        ? await fetch(`/api/announcements/${initialId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Lưu thất bại.");

      setToast({ kind: "ok", msg: publish ? "Đã đăng tin" : "Đã lưu nháp" });
      if (!initialId && body?.id) {
        router.push("/admin");
        router.refresh();
      }
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Lưu thất bại." });
    } finally {
      setBusy(null);
    }
  }

  async function genAudio() {
    if (!initialId) {
      setToast({ kind: "err", msg: "Lưu tin trước rồi tạo giọng đọc." });
      return;
    }
    setBusy("audio");
    setToast(null);
    try {
      const res = await fetch(`/api/announcements/${initialId}/audio`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Tạo giọng đọc thất bại.");
      setToast({ kind: "ok", msg: "Đã tạo giọng đọc dự phòng" });
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Tạo giọng đọc thất bại." });
    } finally {
      setBusy(null);
    }
  }

  const label: React.CSSProperties = {
    display: "block",
    fontSize: "var(--meta-size)",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: 4,
  };
  const input: React.CSSProperties = {
    width: "100%",
    minHeight: "var(--control-min-h)",
    padding: "8px 12px",
    border: "1px solid var(--control)",
    borderRadius: "var(--control-radius)",
    background: "var(--surface)",
    marginBottom: 12,
    fontSize: "var(--body-size)",
  };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: "calc(22px * var(--font-base))" }}>
          {initialId ? "Sửa tin" : "Tin mới"}
        </h1>
        <Link href="/admin" className="btn btn--ghost" style={{ minHeight: 40 }}>
          Danh sách
        </Link>
      </header>

      {toast && (
        <div
          className="card"
          role="status"
          style={{
            marginBottom: 12,
            borderColor: toast.kind === "ok" ? "var(--accent-track)" : "var(--negative)",
            background: toast.kind === "ok" ? "var(--accent-soft)" : "var(--urgent-bg)",
            color: toast.kind === "ok" ? "var(--accent-ink)" : "var(--urgent-ink)",
          }}
        >
          {toast.msg}
        </div>
      )}

      <fieldset style={{ border: "none", marginBottom: 12, display: "flex", gap: 16 }}>
        <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 48 }}>
          <input type="radio" checked={mode === "text"} onChange={() => setMode("text")} />
          Dán văn bản
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 48 }}>
          <input type="radio" checked={mode === "image"} onChange={() => setMode("image")} />
          Tải ảnh
        </label>
      </fieldset>

      {mode === "text" ? (
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Dán nội dung thông báo…"
          rows={6}
          style={{ ...input, resize: "vertical" }}
        />
      ) : (
        <div style={{ marginBottom: 12 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ ...input, padding: 12 }}
          />
          <p style={{ fontSize: "var(--meta-size)", color: "var(--muted)" }}>JPG/PNG/WebP · tối đa 2 MB</p>
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary btn--block"
        onClick={() => void analyze()}
        disabled={busy !== null}
        style={{ marginBottom: 20 }}
      >
        {busy === "upload" ? "Đang tải ảnh…" : busy === "analyze" ? "Đang phân tích…" : "Phân tích bằng AI"}
      </button>

      {confidence && (
        <div
          className="card"
          style={{
            background: "#fffbeb",
            borderColor: "var(--warning)",
            color: "var(--warning)",
            marginBottom: 16,
            fontSize: "var(--meta-size)",
          }}
        >
          <strong>Ghi chú kiểm tra:</strong> {confidence}
        </div>
      )}

      <div className="card" style={{ display: "grid", gap: 4 }}>
        <label style={label} htmlFor="f-title">Tiêu đề</label>
        <input id="f-title" style={input} value={draft.title} onChange={(e) => set("title", e.target.value)} />

        <label style={label} htmlFor="f-cat">Danh mục</label>
        <select id="f-cat" style={input} value={draft.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label style={{ ...label, display: "flex", gap: 8, alignItems: "center", minHeight: 48 }}>
          <input
            type="checkbox"
            checked={draft.is_urgent}
            onChange={(e) => set("is_urgent", e.target.checked)}
          />
          Khẩn cấp
        </label>

        <label style={label} htmlFor="f-main">Tóm tắt chính</label>
        <textarea id="f-main" rows={3} style={{ ...input, resize: "vertical" }} value={draft.summary_main} onChange={(e) => set("summary_main", e.target.value)} />

        <label style={label} htmlFor="f-time">Thời gian &amp; địa điểm</label>
        <textarea id="f-time" rows={2} style={{ ...input, resize: "vertical" }} value={draft.summary_time_location} onChange={(e) => set("summary_time_location", e.target.value)} />

        <label style={label} htmlFor="f-act">Cần làm gì</label>
        <textarea id="f-act" rows={2} style={{ ...input, resize: "vertical" }} value={draft.summary_action_required} onChange={(e) => set("summary_action_required", e.target.value)} />

        <label style={label} htmlFor="f-orig">Nguyên văn</label>
        <textarea id="f-orig" rows={3} style={{ ...input, resize: "vertical" }} value={draft.original_text} onChange={(e) => set("original_text", e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
        <button type="button" className="btn btn--primary" disabled={busy !== null} onClick={() => void save(draft.is_published)}>
          {busy === "save" ? "Đang lưu…" : draft.is_published ? "Đăng ngay" : "Lưu nháp"}
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy !== null} onClick={() => void save(false)}>
          Lưu nháp
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy !== null} onClick={() => void genAudio()}>
          {busy === "audio" ? "Đang tạo…" : "Tạo giọng đọc"}
        </button>
      </div>
      <p style={{ marginTop: 12, fontSize: "var(--meta-size)", color: "var(--muted)" }}>
        Đăng = hiện trên bảng tin cư dân. Lưu nháp = chỉ admin thấy (ẩn).
      </p>
    </div>
  );
}
