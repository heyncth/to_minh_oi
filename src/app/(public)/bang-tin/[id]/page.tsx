import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { NoticeCard } from "@/components/NoticeCard";
import { getPublishedAnnouncement } from "@/lib/announcements";

type Props = { params: Promise<{ id: string }> };

// Per-id published data — must render at request time (cacheComponents).
export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getPublishedAnnouncement(id);
  if (!item) return { title: "Không thấy tin – Tổ Mình Ơi" };

  const title = `${item.title} – Tổ Mình Ơi`;
  const description = item.summary_main || "Bảng tin tổ dân phố Cẩm Lệ";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: `/api/announcements/${id}/card?variant=og`,
          width: 1200,
          height: 630,
          alt: item.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/announcements/${id}/card?variant=og`],
    },
  };
}

async function DetailContent({ id }: { id: string }) {
  const item = await getPublishedAnnouncement(id);
  if (!item) notFound();

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "16px 16px 32px", display: "grid", gap: 12 }}>
      <Link
        href="/"
        className="btn btn--ghost"
        style={{ justifySelf: "start", textDecoration: "none" }}
      >
        ← Xem tất cả thông báo của tổ
      </Link>
      <NoticeCard item={item} />
    </div>
  );
}

export default async function BangTinDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
          <div className="skeleton-card" aria-busy="true" />
        </div>
      }
    >
      <DetailContent id={id} />
    </Suspense>
  );
}
