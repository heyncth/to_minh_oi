"use client";

import { useEffect, useRef, useState } from "react";
import { IconRadioOff, IconRadioOn } from "./Icons";

type Scale = "md" | "lg" | "xl";

const OPTIONS: { value: Scale; label: string }[] = [
  { value: "md", label: "Vừa" },
  { value: "lg", label: "Lớn" },
  { value: "xl", label: "Rất lớn" },
];

function currentScale(): Scale {
  const v = document.documentElement.getAttribute("data-font-scale");
  return v === "lg" || v === "xl" ? v : "md";
}

export function FontSizeToggle() {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState<Scale>("md");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function apply(next: Scale) {
    setScale(next);
    document.documentElement.setAttribute("data-font-scale", next);
    localStorage.setItem("font-scale", next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Đổi cỡ chữ"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => {
          if (!open) setScale(currentScale());
          setOpen((v) => !v);
        }}
      >
        Aa
      </button>
      {open && (
        <div className="font-popover" role="radiogroup" aria-label="Cỡ chữ">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={scale === o.value}
              className="font-popover__option"
              onClick={() => apply(o.value)}
            >
              {scale === o.value ? (
                <IconRadioOn width={20} height={20} />
              ) : (
                <IconRadioOff width={20} height={20} />
              )}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
