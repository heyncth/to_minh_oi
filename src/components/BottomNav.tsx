"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Bảng tin", icon: "📰" },
  { href: "/tro-ly", label: "Trợily", icon: "💬" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {t.icon}
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
