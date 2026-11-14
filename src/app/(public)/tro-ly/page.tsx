const RAG_CHIPS = [
  "Làm giấy khai sinh cần gì?",
  "Xác nhận cư trú ở đâu?",
  "Đăng ký thường trú mang giấy tờ gì?",
  "Cấp thẻ BHYT nộp ở đâu?",
  "CCCD đổi ở đâu?",
];

const SCAM_SAMPLES = [
  { id: "sample-otp", label: "Mẫu 1: OTP khóa tài khoản" },
  { id: "sample-apk", label: "Mẫu 2: Cài APK" },
  { id: "sample-lottery", label: "Mẫu 3: Trúng thưởng" },
] as const;

export default function TroLyPage() {
  return (
    <>
      <h1 className="page-title">Trợily</h1>

      <p className="chat-empty__slogan">
        Cần hỏi thủ tục hay kiểm tra tin nhắn lạ, cứ nhắn Tổ Mình Ơi!
      </p>

      <p className="section-label">Gửi câu hỏi</p>
      <div className="chip-row">
        {RAG_CHIPS.map((c) => (
          <button key={c} type="button" className="chip" disabled>
            {c}
          </button>
        ))}
      </div>

      <p className="section-label">Thử mẫu lừa đảo</p>
      <div className="chip-row">
        {SCAM_SAMPLES.map((s) => (
          <button key={s.id} type="button" className="chip" disabled>
            {s.label}
          </button>
        ))}
      </div>

      {/* Composer + chat UI land in P4.6 */}
      <div
        className="card"
        style={{ marginTop: 24, color: "var(--muted)", fontSize: "var(--meta-size)" }}
      >
        Hộp nhập câu hỏi sẽ hoạt động ở bước Trợily (P4).
      </div>
    </>
  );
}
