"use client";

import { useState } from "react";
import type { Announcement } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { bulletinSpeechText } from "@/lib/speech-text";
import { ListenButton } from "./ListenButton";
import { ShareSheet } from "./ShareSheet";
import { IconShare } from "./Icons";

export function NoticeCard({ item }: { item: Announcement }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const speakText = bulletinSpeechText(item);

  return (
    <article className="card" style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          {item.is_urgent && (
            <span
              style={{
                background: "var(--urgent-bg)",
                color: "var(--urgent-ink)",
                borderRadius: "var(--pill-radius)",
                padding: "4px 10px",
                fontSize: "var(--meta-size)",
                fontWeight: 700,
              }}
            >
              Khẩn cấp
            </span>
          )}
          <span
            style={{
              background: "var(--raised)",
              color: "var(--muted)",
              borderRadius: "var(--pill-radius)",
              padding: "4px 10px",
              fontSize: "var(--meta-size)",
            }}
          >
            {item.category}
          </span>
        </div>
        <time dateTime={item.created_at} style={{ color: "var(--muted)", fontSize: "var(--meta-size)" }}>
          {formatDate(item.created_at)}
        </time>
      </div>

      <h2 style={{ fontSize: "calc(20px * var(--font-base))", fontWeight: 600, lineHeight: 1.35 }}>
        {item.title}
      </h2>

      <div style={{ display: "grid", gap: 8 }}>
        <p>
          <strong>Tóm tắt:</strong> {item.summary_main}
        </p>
        {item.summary_time_location && (
          <p>
            <strong>Thời gian &amp; địa điểm:</strong> {item.summary_time_location}
          </p>
        )}
        {item.summary_action_required && (
          <p>
            <strong>Người dân cần làm gì:</strong> {item.summary_action_required}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <ListenButton text={speakText} audioUrl={item.audio_url} />
        <button type="button" className="btn btn--ghost" onClick={() => setShareOpen(true)}>
          <IconShare width={18} height={18} style={{ verticalAlign: "-3px" }} /> Chia sẻ
        </button>
        {item.original_text && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setShowOriginal((v) => !v)}
            aria-expanded={showOriginal}
          >
            {showOriginal ? "Ẩn nguyên văn" : "Xem nguyên văn ›"}
          </button>
        )}
      </div>

      {showOriginal && item.original_text && (
        <div
          style={{
            background: "var(--raised)",
            borderRadius: "var(--control-radius)",
            padding: 12,
            whiteSpace: "pre-wrap",
            fontSize: "var(--meta-size)",
            color: "var(--muted)",
          }}
        >
          {item.original_text}
        </div>
      )}

      {item.original_image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.original_image_url}
          alt={item.title || "Ảnh thông báo"}
          style={{ width: "100%", borderRadius: "var(--control-radius)", border: "1px solid var(--border)" }}
        />
      )}

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} id={item.id} />
    </article>
  );
}
