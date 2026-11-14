"use client";

import Link from "next/link";
import { FontSizeToggle } from "./FontSizeToggle";

export function TopBar() {
  return (
    <header className="topbar">
      <Link href="/" className="topbar__brand">
        Tổ Mình Ơi
      </Link>
      <div className="topbar__actions">
        <FontSizeToggle />
        <Link
          href="/admin/login"
          className="icon-btn"
          style={{ fontWeight: 500, fontSize: "var(--meta-size)", padding: "0 10px" }}
        >
          Tổ trưởng
        </Link>
      </div>
    </header>
  );
}
