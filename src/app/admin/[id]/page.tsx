"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { AdminNoticeForm } from "@/components/AdminNoticeForm";

function EditForm() {
  const params = useParams<{ id: string }>();
  return <AdminNoticeForm initialId={params.id} />;
}

export default function EditAnnouncementPage() {
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
          <div className="skeleton-card" aria-busy="true" />
        </div>
      }
    >
      <EditForm />
    </Suspense>
  );
}
