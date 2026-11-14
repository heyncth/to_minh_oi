export default function HomePage() {
  return (
    <>
      <div className="home-banner">Bảng tin tổ dân phố – Trợ lý hỏi đáp 24/7</div>

      {/* Category chips + NoticeCard list land in P2.1–2.2 */}
      <div className="skeleton-card" aria-busy="true" aria-label="Đang tải tin">
        <p style={{ color: "var(--muted)", fontSize: "var(--meta-size)" }}>
          Đang tải bảng tin…
        </p>
        <p style={{ marginTop: 8, fontSize: "var(--meta-size)", color: "var(--muted)" }}>
          (Danh sách tin sẽ xuất hiện sau khi kết nối dữ liệu phường.)
        </p>
      </div>
    </>
  );
}
