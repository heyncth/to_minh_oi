"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBulletin, IconChat } from "./Icons";

const TABS = [
  { href: "/", label: "Bảng tin", Icon: IconBulletin },
  { href: "/tro-ly", label: "Trợ lý", Icon: IconChat },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav" aria-label="Điều hướng chính">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        const { Icon } = t;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`bottom-nav__item${active ? " bottom-nav__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              <Icon width={22} height={22} />
            </span>
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
