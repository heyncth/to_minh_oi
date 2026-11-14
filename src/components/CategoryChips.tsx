"use client";

import { CATEGORIES, type CategoryFilter } from "@/lib/types";

export function CategoryChips({
  value,
  onChange,
  counts,
}: {
  value: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
  counts?: Partial<Record<CategoryFilter, number>>;
}) {
  return (
    <div
      className="chip-row"
      role="tablist"
      aria-label="Danh mục tin"
      style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}
    >
      {CATEGORIES.map((c) => {
        const selected = value === c;
        const n = counts?.[c];
        return (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`chip${selected ? " chip--selected" : ""}`}
            onClick={() => onChange(c)}
          >
            {c}
            {typeof n === "number" && c !== "Tất cả" ? ` (${n})` : ""}
          </button>
        );
      })}
    </div>
  );
}
