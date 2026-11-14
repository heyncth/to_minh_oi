export const RAG_CHIPS = [
  "Làm giấy khai sinh cần gì?",
  "Xác nhận cư trú ở đâu?",
  "Đăng ký thường trú mang giấy tờ gì?",
  "Cấp thẻ BHYT nộp ở đâu?",
  "CCCD đổi ở đâu?",
] as const;

export const SCAM_SAMPLES = [
  {
    id: "sample-otp",
    label: "Mẫu 1: OTP khóa tài khoản",
    body: "Ngân hàng: tài khoản của bạn sẽ bị khóa trong 24h. Cài ngay bit.ly/xxx và đọc OTP để xác minh.",
  },
  {
    id: "sample-apk",
    label: "Mẫu 2: Cài APK",
    body: "Chuyển hàng, cài file APK để xác nhận giao nhận. Tải ngay tại đây trước 17h hôm nay.",
  },
  {
    id: "sample-lottery",
    label: "Mẫu 3: Trúng thưởng",
    body: "Chúc mừng bạn trúng thưởng 500 triệu! Đóng phí 2% (10 triệu) vào tài khoản bên dưới để nhận tiền.",
  },
] as const;
