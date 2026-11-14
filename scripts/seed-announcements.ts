/**
 * P0 seed companion — insert 6 SAMPLE announcements (published).
 * Run: npm run seed:announcements
 * SAMPLE — verify with ward before live (AGENTS.md rule 10).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

type Seed = {
  title: string;
  category: string;
  is_urgent: boolean;
  summary_main: string;
  summary_time_location: string;
  summary_action_required: string;
  original_text: string;
};

const ANNOUNCEMENTS: Seed[] = [
  {
    title: "Tiêm chủng mở rộng cho trẻ em tháng 12",
    category: "Y tế",
    is_urgent: true,
    summary_main:
      "Trạm Y tế phường Cẩm Lệ tổ chức tiêm chủng mở rộng cho trẻ em trong độ tuổi. Cha mẹ đưa con đến theo lịch từng tổ dân phố.",
    summary_time_location:
      "08:00–11:00, các buổi sáng trong tuần; tại Trạm Y tế phường (số … đường …).",
    summary_action_required:
      "Mang theo sổ tiêm chủng, giấy khai sinh hoặc CCCD của trẻ; trẻ đang sốt hoặc uống thuốc kháng sinh cần hoãn và báo lại.",
    original_text: "(dán nguyên văn thông báo Trạm Y tế khi có)",
  },
  {
    title: "Tổng vệ sinh môi trường phòng chống dịch sốt xuất huyết",
    category: "Môi trường",
    is_urgent: false,
    summary_main:
      "Đợt tổng vệ sinh môi trường, loại bỏ vật đọng nước, diệt lăng quăng bọ gậy trên địa bàn phường.",
    summary_time_location:
      "Thứ Bảy hằng tuần; điểm tập trung từng tổ dân phố do Tổ trưởng thông báo.",
    summary_action_required:
      "Dọn dẹp sân thượng, chậu cây, lốp xe cũ; tham gia lao động cùng tổ; mang găng tay nếu có.",
    original_text: "",
  },
  {
    title: "Đăng ký khám sức khỏe nghĩa vụ quân sự",
    category: "Hành chính",
    is_urgent: true,
    summary_main:
      "Nam công dân đủ tuổi thực hiện nghĩa vụ quân sự đăng ký khám sức khỏe tại UBND phường trước đợt khám của quận.",
    summary_time_location:
      "Trong tháng được phân công; tại Bộ phận Một cửa UBND phường Cẩm Lệ, giờ hành chính.",
    summary_action_required:
      "Mang CCCD, sổ hộ khẩu hoặc giấy xác nhận cư trú, 2 ảnh 4x6; liên hệ Tổ trưởng nếu chưa nhận giấy mời.",
    original_text: "",
  },
  {
    title: "Cảnh báo lừa đảo giả mạo ngân hàng",
    category: "An ninh",
    is_urgent: true,
    summary_main:
      "Nhiều người dân nhận tin nhắn/Zalo mạo danh ngân hàng yêu cầu cài app hoặc chuyển tiền “xác minh”. Đây là lừa đảo.",
    summary_time_location:
      "Diễn ra liên tục qua SMS, Zalo, cuộc gọi; không gắn một sự kiện cụ thể.",
    summary_action_required:
      "Không cài app theo link lạ; không đọc mã OTP; gọi tổng đài in trên thẻ ngân hàng để xác minh; báo công an phường nếu đã chuyển tiền.",
    original_text: "",
  },
  {
    title: "Hội chợ Tết tại Nhà văn hóa phường",
    category: "Sự kiện",
    is_urgent: false,
    summary_main:
      "Hội chợ Tết với gian hàng đặc sản, quà Tết, biểu diễn nghệ thuật chào năm mới.",
    summary_time_location:
      "(ngày cụ thể do Ban Tổ chức ấn định); Nhà văn hóa phường Cẩm Lệ.",
    summary_action_required:
      "Đến sớm nếu muốn mua hàng; giữ trẻ nhỏ; không mang vũ khí, vật cấm.",
    original_text: "",
  },
  {
    title: "Điểm thu gom rác thải điện tử",
    category: "Môi trường",
    is_urgent: false,
    summary_main:
      "Phường tiếp nhận pin, bóng đèn huỳnh quang, thiết bị điện tử cũ để xử lý đúng quy định.",
    summary_time_location: "Các buổi chiều thứ Năm hằng tuần; điểm thu gom tại trụ sở UBND phường.",
    summary_action_required:
      "Mang thiết bị còn nguyên vỏ; không vứt pin vào thùng rác sinh hoạt; hỏi nhân viên nếu chưa chắc phân loại.",
    original_text: "",
  },
];

async function main() {
  let createdBy: string | null = null;
  if (adminEmail) {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (!error) {
      createdBy = data.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())?.id ?? null;
    }
  }

  let inserted = 0;
  for (const a of ANNOUNCEMENTS) {
    const { error } = await supabase.from("announcements").insert({
      ...a,
      is_published: true,
      created_by: createdBy,
    });
    if (error) {
      console.error(`fail: ${a.title}: ${error.message}`);
      process.exitCode = 1;
    } else {
      inserted += 1;
      console.log(`ok: ${a.title}`);
    }
  }
  console.log(`done: ${inserted}/${ANNOUNCEMENTS.length} announcements published`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
