"use client";

import { useEffect, useMemo, useState } from "react";
import { CategoryChips } from "@/components/CategoryChips";
import { NoticeCard } from "@/components/NoticeCard";
import type { Announcement, CategoryFilter } from "@/lib/types";

export function BulletinBoard() {
  const [items, setItems] = useState<Announcement[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<CategoryFilter>("Tất cả");
  const [retryToken, setRetryToken] = useState(0);

  // One fetch of the full list; counts + category filter derive client-side
  // (docs/06-TDD.md §filter). Counts stay visible on every chip.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/announcements?limit=50`)
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
  }, [retryToken]);

  const counts = useMemo(() => {
    const c: Partial<Record<CategoryFilter, number>> = { "Tất cả": items?.length ?? 0 };
    for (const a of items ?? []) {
      const k = a.category as CategoryFilter;
      c[k] = (c[k] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    if (items === null) return null;
    return category === "Tất cả" ? items : items.filter((a) => a.category === category);
  }, [items, category]);

  return (
    <>
      <CategoryChips value={category} onChange={setCategory} counts={counts} />

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

      {visible !== null && items !== null && visible.length === 0 && !error && (
        <div className="empty-state">
          <p style={{ fontWeight: 600, color: "var(--text)" }}>Chưa có tin mới</p>
        </div>
      )}

      {visible && visible.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {visible.map((a) => (
            <NoticeCard key={a.id} item={a} />
          ))}
        </div>
      )}
    </>
  );
}
