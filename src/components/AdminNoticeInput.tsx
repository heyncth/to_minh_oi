"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminSteps } from "@/components/AdminSteps";
import {
  ADMIN_DRAFT_KEY,
  EMPTY_DRAFT,
  loadAdminRaw,
  saveAdminDraft,
  saveAdminRaw,
  type AdminDraft,
} from "@/lib/admin-draft";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGES = 5;

type Picked = { file: File; url: string };

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminNoticeInput() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [remoteUrls, setRemoteUrls] = useState<string[]>([]);
  const [busy, setBusy] = useState<"upload" | "analyze" | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore wizard state when returning from step 2 (deferred so SSR markup matches).
  useEffect(() => {
    const t = window.setTimeout(() => {
      setRawText(loadAdminRaw());
      try {
        const raw = sessionStorage.getItem(ADMIN_DRAFT_KEY);
        if (raw) {
          const d = JSON.parse(raw) as AdminDraft;
          if (Array.isArray(d?.original_image_url)) setRemoteUrls(d.original_image_url);
        }
      } catch {
        /* ignore */
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const pickedRef = useRef<Picked[]>([]);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  useEffect(() => {
    return () => {
      for (const p of pickedRef.current) URL.revokeObjectURL(p.url);
    };
  }, []);

  const totalImages = remoteUrls.length + picked.length;

  function addFiles(list: FileList | null | undefined) {
    if (!list) return;
    const next = [...picked];
    for (const f of Array.from(list)) {
      if (next.length + remoteUrls.length >= MAX_IMAGES) {
        setToast({ kind: "err", msg: `Tối đa ${MAX_IMAGES} ảnh mỗi tin.` });
        break;
      }
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setToast({ kind: "err", msg: "Chỉ nhận ảnh JPG, PNG hoặc WebP." });
        continue;
      }
      if (f.size > MAX_FILE_BYTES) {
        setToast({ kind: "err", msg: `Ảnh "${f.name}" lớn hơn 2 MB.` });
        continue;
      }
      next.push({ file: f, url: URL.createObjectURL(f) });
    }
    setPicked(next);
  }

  function removePicked(i: number) {
    setPicked((cur) => {
      URL.revokeObjectURL(cur[i].url);
      return cur.filter((_, idx) => idx !== i);
    });
  }

  function removeRemote(i: number) {
    setRemoteUrls((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function analyze() {
    if (!rawText.trim() && totalImages === 0) {
      setToast({ kind: "err", msg: "Dán nội dung hoặc chọn ảnh thông báo trước." });
      return;
    }
    setToast(null);
    try {
      const newUrls: string[] = [];
      if (picked.length > 0) {
        setBusy("upload");
        for (const p of picked) {
          const fd = new FormData();
          fd.append("file", p.file);
          const up = await fetch("/api/upload", { method: "POST", body: fd });
          const upBody = await up.json().catch(() => null);
          if (!up.ok) throw new Error(upBody?.error?.message ?? "Tải ảnh thất bại.");
          newUrls.push(upBody.url as string);
        }
      }

      const imageUrls = [...remoteUrls, ...newUrls];
      setBusy("analyze");
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText.trim() || undefined,
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error?.message ?? "Phân tích thất bại.");

      const draft: AdminDraft = {
        ...EMPTY_DRAFT,
        title: body.title || "",
        category: body.category || "Hành chính",
        is_urgent: Boolean(body.is_urgent),
        summary_main: body.summary_main || "",
        summary_time_location: body.summary_time_location || "",
        summary_action_required: body.summary_action_required || "",
        original_text: body.original_text || rawText,
        original_image_url: imageUrls.length > 0 ? imageUrls : null,
        confidence_notes: body.confidence_notes || "",
      };
      saveAdminDraft(draft);
      saveAdminRaw(rawText);
      router.push("/admin/draft");
    } catch (e) {
      setToast({ kind: "err", msg: e instanceof Error ? e.message : "Phân tích thất bại." });
      setBusy(null);
    }
  }

  function manualDraft() {
    saveAdminDraft({ ...EMPTY_DRAFT, original_text: rawText });
    saveAdminRaw(rawText);
    router.push("/admin/draft");
  }

  const analyzing = busy !== null;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p className="admin-kicker">Quản trị Tổ dân phố</p>
          <h1 style={{ fontSize: "calc(22px * var(--font-base))" }}>Tin mới</h1>
        </div>
        <Link href="/admin" className="btn btn--ghost" style={{ minHeight: 40 }}>
          Danh sách
        </Link>
      </header>

      <AdminSteps step={1} />

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
        <label style={{ ...labelStyle, marginBottom: 0 }} htmlFor="f-raw">
          Nội dung thông báo
        </label>
      </div>
      <textarea
        id="f-raw"
        className="admin-textarea"
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Dán nội dung thông báo từ Zalo…"
        rows={7}
      />

      <div className="admin-field__row">
        <span style={labelStyle}>Ảnh tài liệu</span>
        <span style={{ fontSize: "var(--meta-size)", color: "var(--muted)" }}>
          {totalImages}/{MAX_IMAGES} ảnh
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {totalImages === 0 ? (
        <div
          className={`admin-dropzone${dragOver ? " admin-dropzone--active" : ""}`}
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
            addFiles(e.dataTransfer.files);
          }}
        >
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
          <span>
            Tối đa {MAX_IMAGES} ảnh · JPG/PNG/WebP · mỗi ảnh ≤ 2 MB{totalImages === 0 ? " · kéo thả trên máy tính" : ""}
          </span>
        </div>
      ) : (
        <>
          <div className="img-grid">
            {remoteUrls.map((url, i) => (
              <div key={`r-${url}`} className="img-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh thông báo ${i + 1}`} />
                <button
                  type="button"
                  className="img-tile__x"
                  aria-label={`Xóa ảnh ${i + 1}`}
                  onClick={() => removeRemote(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            {picked.map((p, i) => (
              <div key={`p-${p.url}`} className="img-tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Ảnh đã chọn ${i + 1}`} />
                <button
                  type="button"
                  className="img-tile__x"
                  aria-label={`Xóa ảnh ${i + 1}`}
                  onClick={() => removePicked(i)}
                >
                  ✕
                </button>
              </div>
            ))}
            {totalImages < MAX_IMAGES && (
              <button type="button" className="img-tile__add" onClick={() => fileRef.current?.click()}>
                <span aria-hidden="true">＋</span>
                Thêm ảnh
              </button>
            )}
          </div>
          <p className="img-summary">
            {totalImages}/{MAX_IMAGES} ảnh
            {picked.length > 0 && ` · ${formatBytes(picked.reduce((s, p) => s + p.file.size, 0))} chờ tải`}
            {" · "}JPG/PNG/WebP · mỗi ảnh ≤ 2 MB
          </p>
        </>
      )}

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <button type="button" className="btn btn--primary" onClick={() => void analyze()} disabled={analyzing}>
          Phân tích bằng AI
        </button>
        <button type="button" className="btn btn--ghost" onClick={manualDraft} disabled={analyzing}>
          Tạo thủ công
        </button>
      </div>

      {analyzing && (
        <div className="ai-overlay" role="status" aria-live="polite">
          <div className="ai-overlay__card">
            <div className="ai-overlay__spin" aria-hidden="true" />
            <p className="ai-overlay__title">AI đang đọc và tóm tắt...</p>
            <div className="ai-steps">
              <div className={`ai-steps__row${busy === "upload" ? " ai-steps__row--on" : " ai-steps__row--done"}`}>
                <span className="ai-steps__mark" aria-hidden="true">
                  {busy === "upload" ? "◐" : "✓"}
                </span>
                Tải ảnh lên thư viện
              </div>
              <div className={`ai-steps__row${busy === "analyze" ? " ai-steps__row--on" : ""}`}>
                <span className="ai-steps__mark" aria-hidden="true">
                  {busy === "analyze" ? "◐" : "○"}
                </span>
                AI phân tích và tóm tắt
              </div>
              <div className="ai-steps__row">
                <span className="ai-steps__mark" aria-hidden="true">
                  ○
                </span>
                Tạo nháp 3 ý
              </div>
            </div>
            <p className="ai-overlay__eta">Khoảng 10–20 giây, cô/chú đợi chút ạ</p>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "var(--meta-size)",
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: 4,
};
