"use client";

import { useEffect, useState } from "react";
import { IconClose } from "./Icons";

type Props = {
  open: boolean;
  onClose: () => void;
  id: string;
};

/** Bottom sheet: preview card PNG · download · copy link. */
export function ShareSheet({ open, onClose, id }: Props) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );

  useEffect(() => {
    if (!open) return;
    let objectUrl: string | null = null;
    let alive = true;
    // shortcut: setTimeout(0) — lint bans sync setState in effect body
    const timer = window.setTimeout(() => {
      void (async () => {
        setImgUrl(null);
        setCopied(false);
        setFailed(false);
        try {
          const res = await fetch(`/api/announcements/${id}/card?variant=share`, {
          cache: "no-store",
        });
          if (!res.ok) throw new Error("bad status");
          const blob = await res.blob();
          if (!alive) return;
          objectUrl = URL.createObjectURL(blob);
          setImgUrl(objectUrl);
        } catch {
          if (alive) setFailed(true);
        }
      })();
    }, 0);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const link = `${origin}/bang-tin/${id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — link stays visible for manual copy
    }
  }

  function downloadImage() {
    if (!imgUrl) return;
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = `tin-to-minh-oi-${id.slice(0, 8)}.png`;
    a.click();
  }

  return (
    <div className="share-sheet">
      <div className="share-sheet__backdrop" onClick={onClose} aria-hidden />
      <div className="share-sheet__panel" role="dialog" aria-modal="true" aria-label="Chia sẻ tin này">
        <div className="share-sheet__handle" aria-hidden />
        <div className="share-sheet__head">
          <h2 className="share-sheet__title">Chia sẻ tin này</h2>
          <button type="button" className="share-sheet__close" onClick={onClose} aria-label="Đóng">
            <IconClose width={22} height={22} />
          </button>
        </div>

        <div className="share-sheet__preview">
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl} alt="Ảnh chia sẻ tin này" />
          )}
          {!imgUrl && (
            <p className="share-sheet__status" role="status">
              {failed ? "Không tải được ảnh chia sẻ." : "Đang tải ảnh…"}
            </p>
          )}
        </div>

        <p className="share-sheet__link">{link}</p>

        <div className="share-sheet__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={downloadImage}
            disabled={!imgUrl}
          >
            Tải ảnh chia sẻ
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={copyLink}>
            {copied ? "Đã sao chép liên kết" : "Sao chép liên kết"}
          </button>
        </div>
      </div>
    </div>
  );
}
