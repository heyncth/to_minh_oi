"use client";

import { useEffect, useState } from "react";
import { CategoryChips } from "@/components/CategoryChips";
import { NoticeCard } from "@/components/NoticeCard";
import type { Announcement, CategoryFilter } from "@/lib/types";

export function BulletinBoard() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("Tất cả");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const qs = category === "Tất cả" ? "" : `?category=${encodeURIComponent(category)}`;
    fetch(`/api/announcements${qs}`)
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error?.message ?? "Không tải được bảng tin.");
        if (!cancelled) {
          setItems(body.items as Announcement[]);
          setError(null);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setItems([]);
          setError(e.message || "Không tải được bảng tin. Vui lòng thử lại.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [category, retryToken]);

  const counts: Partial<Record<CategoryFilter, number>> = {};
  if (items) {
    counts["Tất cả"] = items.length;
    // counts only meaningful on Tất cả view; skip when filtered
    if (category === "Tất cả") {
      for (const a of items) {
        const c = a.category as CategoryFilter;
        counts[c] = (counts[c] ?? 0) + 1;
      }
    }
  }

  return (
    <>
      <CategoryChips value={category} onChange={setCategory} counts={category === "Tất cả" ? counts : undefined} />

      {error && (
        <div className="card" role="alert" style={{ borderColor: "var(--negative)" }}>
          <p style={{ color: "var(--negative)" }}>{error}</p>
          <button type="button" className="btn btn--ghost" style={{ marginTop: 8 }} onClick={() => setRetryToken((t) => t + 1)}>
            Thử lại
          </button>
        </div>
      )}

      {items === null && !error && (
        <div style={{ display: "grid", gap: 12 }} aria-busy="true" aria-label="Đang tải tin">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {items !== null && items.length === 0 && !error && (
        <div className="empty-state">
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Chưa có tin mới</p>
        </div>
      )}

      {items && items.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((a) => (
            <NoticeCard key={a.id} item={a} />
          ))}
        </div>
      )}
    </>
  );
}
