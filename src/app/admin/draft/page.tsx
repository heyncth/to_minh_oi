"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNoticeForm } from "@/components/AdminNoticeForm";
import { loadAdminDraft, type AdminDraft } from "@/lib/admin-draft";

function DraftForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<AdminDraft | undefined>(undefined);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const d = loadAdminDraft();
      if (!d) {
        router.replace("/admin/new");
        return;
      }
      setDraft(d);
    }, 0);
    return () => window.clearTimeout(t);
  }, [router]);

  if (draft === undefined) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
        <div className="skeleton-card" aria-busy="true" />
      </div>
    );
  }
  return <AdminNoticeForm initialDraft={draft} />;
}

export default function DraftAnnouncementPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
          <div className="skeleton-card" aria-busy="true" />
        </div>
      }
    >
      <DraftForm />
    </Suspense>
  );
}
