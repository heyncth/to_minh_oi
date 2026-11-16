"use client";

import { useEffect, useRef, useState } from "react";
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

// Demo content for judges — "Điền mẫu thử"
const SAMPLE_TEXT = `THÔNG BÁO TIÊM CHỦNG MÙA XUÂN

Kính gửi các hộ dân tổ 2, 3, 4 phường Cẩm Lệ!

Trạm Y tế phường tổ chức tiêm phòng sởi – rubella cho trẻ em từ 12 tháng đến 5 tuổi.

Thời gian: 8h00 – 11h00, thứ Bảy ngày 22/11/2026
Địa điểm: Trạm Y tế phường Cẩm Lệ, số 12 Lê Quý Đôn
Đối tượng: Trẻ em trong độ tuổi, mang theo sổ tiêm chủng

Phụ huynh cho trẻ ăn no trước khi tiêm. Miễn phí toàn bộ. Liên hệ 02363 888888 nếu trẻ đang sốt hoặc bị cảm để được hoãn lịch.

UBND phường Cẩm Lệ`;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminNoticeForm({ initialId }: { initialId?: string }) {
  const router = useRouter();
  // New notice: draft card hidden until AI finishes or "Tạo thủ công".
  // Edit: card visible immediately.
  const [showForm, setShowForm] = useState(Boolean(initialId));
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [rawText, setRawText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "analyze" | "save" | "audio" | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Draft>(k: K, v: Draft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  function pickFile(f: File | null | undefined) {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setToast({ kind: "err", msg: "Chỉ nhận ảnh JPG, PNG hoặc WebP." });
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setToast({ kind: "err", msg: "Ảnh lớn hơn 2 MB. Cô/chú chụp lại ảnh gọn hơn ạ." });
      return;
    }
    setFile(f);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
    setToast(null);
  }

  function clearFile() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  async function pasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        setToast({ kind: "err", msg: "Bộ nhớ tạm đang trống." });
        return;
      }
      setRawText((prev) => (prev ? `${prev}\n${text}` : text));
      setToast(null);
    } catch {
      setToast({
        kind: "err",
        msg: "Trình duyệt chặn đọc bộ nhớ tạm — cô/chú nhấn giữ ô nhập rồi chọn Dán nhé.",
      });
    }
  }

  function fillSample() {
    setRawText(SAMPLE_TEXT);
    setToast(null);
  }

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function analyze() {
    if (!rawText.trim() && !file) {
      setToast({ kind: "err", msg: "Dán nội dung hoặc chọn ảnh thông báo trước." });
      return;
    }
    setBusy("analyze");
    setToast(null);
    setConfidence(null);
    try {
      let imageUrl: string | undefined;
      if (file) {
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
        body: JSON.stringify({ text: rawText.trim() || undefined, imageUrl }),
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
      setShowForm(true);
      setToast({ kind: "ok", msg: "Đã tạo nháp từ AI — kiểm tra trước khi đăng." });
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Phân tích thất bại." });
    } finally {
      setBusy(null);
    }
  }

  function manualDraft() {
    setDraft({ ...EMPTY, original_text: rawText });
    setConfidence(null);
    setToast(null);
    setShowForm(true);
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
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p className="admin-kicker">Quản trị Tổ dân phố</p>
          <h1 style={{ fontSize: "calc(22px * var(--font-base))" }}>
            {initialId ? "Sửa tin" : "Tin mới"}
          </h1>
        </div>
        <Link href="/admin" className="btn btn--ghost" style={{ minHeight: 40 }}>
          Danh sách
        </Link>
      </header>

      <p className="admin-guide">
        Dán nội dung thông báo từ Zalo hoặc tải ảnh chụp văn bản giấy để AI tự động tóm tắt thành 3 ý dễ đọc.
      </p>

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

      <div className="admin-field__row">
        <label style={{ ...label, marginBottom: 0 }} htmlFor="f-raw">
          Nội dung thông báo
        </label>
        <div className="admin-tools">
          <button type="button" className="btn btn--ghost" onClick={() => void pasteClipboard()} disabled={busy !== null}>
            Dán từ bộ nhớ tạm
          </button>
          <button type="button" className="btn btn--ghost" onClick={fillSample} disabled={busy !== null}>
            Điền mẫu thử
          </button>
        </div>
      </div>
      <textarea
        id="f-raw"
        className="admin-textarea"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Dán nội dung thông báo từ Zalo…"
        rows={7}
      />

      <div
        className={`admin-dropzone${dragOver ? " admin-dropzone--active" : ""}${file ? " admin-dropzone--set" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Chọn ảnh thông báo"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files?.[0]);
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => pickFile(e.target.files?.[0])}
        />
        {file && previewUrl ? (
          <>
            <img className="admin-dropzone__thumb" src={previewUrl} alt="Xem trước ảnh thông báo" />
            <div className="admin-dropzone__meta">
              <span className="admin-dropzone__name">{file.name}</span>
              <span style={{ color: "var(--muted)", fontSize: "var(--meta-size)" }}>
                {formatBytes(file.size)} · JPG/PNG/WebP · tối đa 2 MB
              </span>
              <button
                type="button"
                className="btn btn--ghost"
                style={{ minHeight: 40, marginTop: 4 }}
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                Xóa ảnh
              </button>
            </div>
          </>
        ) : (
          <>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.5 4h-5L8 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-4l-1.5-2Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            <strong>Chạm để chọn ảnh hoặc chụp văn bản thông báo</strong>
            <span>JPG/PNG/WebP · tối đa 2 MB · kéo thả ảnh vào đây trên máy tính</span>
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => void analyze()}
          disabled={busy !== null}
        >
          {busy === "upload" || busy === "analyze" ? (
            <>
              <span className="admin-spin" aria-hidden="true" />
              AI đang đọc và tóm tắt...
            </>
          ) : (
            "Phân tích bằng AI"
          )}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={manualDraft}
          disabled={busy !== null}
        >
          Tạo thủ công
        </button>
      </div>

      {showForm && (
        <>
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
        </>
      )}
    </div>
  );
}
