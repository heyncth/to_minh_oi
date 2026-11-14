import type { ReactNode } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-main">{children}</main>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
