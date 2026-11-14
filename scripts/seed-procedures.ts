/**
 * P0.8 — insert 12 SAMPLE procedures with embedding=null.
 * Run: npm run seed:procedures
 * After insert: embed each row (P4.2) via gemini-embedding-2 @768.
 * SAMPLE content — verify with Bộ phận Một cửa before live (AGENTS.md rule 10).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

type Seed = { procedure_name: string; content: string };

const PROCEDURES: Seed[] = [
  {
    procedure_name: "Đăng ký khai sinh",
    content: `Hồ sơ cần mang: Tờ khai đăng ký khai sinh (mẫu); Giấy chứng sinh; CCCD/CMND của cha hoặc mẹ; Giấy chứng nhận kết hôn của cha mẹ (nếu có).
Nơi nộp: Bộ phận tiếp nhận và trả kết quả – UBND phường Cẩm Lệ (Thứ Hai đến Thứ Sáu, sáng thứ Bảy theo giờ hành chính).
Thời gian giải quyết: Đăng ký ngay trong ngày nếu hồ sơ đủ và nộp trước 15 giờ; trường hợp khác vào ngày làm việc tiếp theo (tham khảo quy định hiện hành).
Lệ phí: Miễn lệ phí đăng ký khai sinh.
Ghi chú: SAMPLE — một số dịch vụ công liên thông đã thực hiện trực tuyến qua Cổng dịch vụ công / VNeID – nên hỏi trước khi đến.`,
  },
  {
    procedure_name: "Đăng ký khai tử",
    content: `Hồ sơ cần mang: Tờ khai đăng ký khai tử; Giấy báo tử hoặc hồ sơ bệnh viện; CCCD của người khai.
Nơi nộp: UBND phường Cẩm Lệ.
Thời gian giải quyết: Theo quy định hiện hành (SAMPLE — xác nhận với phường).
Lệ phí: Miễn lệ phí đăng ký khai tử.
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Cấp bản sao trích lục hộ tịch",
    content: `Hồ sơ cần mang: Đơn/yêu cầu bằng văn bản; CCCD; thông tin đăng ký hộ tịch liên quan.
Nơi nộp: UBND phường Cẩm Lệ.
Thời gian giải quyết: Nhận ngay hoặc theo hẹn (SAMPLE).
Lệ phí: Theo quy định hiện hành (SAMPLE — xác nhận với phường).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Giấy xác nhận tình trạng hôn nhân",
    content: `Hồ sơ cần mang: Đơn yêu cầu; CCCD; bản sao hộ tịch liên quan (nếu có).
Nơi nộp: UBND phường Cẩm Lệ (hoặc cấp huyện tùy quy định hiện hành — verify).
Thời gian giải quyết: Theo quy định hiện hành (SAMPLE).
Lệ phí: Miễn/một phần theo quy định (SAMPLE — xác nhận với phường).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Đăng ký thường trú",
    content: `Hồ sơ cần mang: Tờ khai; giấy tờ chỗ ở hợp pháp.
Nơi nộp: UBND phường Cẩm Lệ / CSDL dân cư – VNeID.
Thời gian giải quyết: Theo quy định hiện hành; nhiều nội dung khai thác CSDL, không bắt buộc sổ hộ khẩu giấy (từ 2023).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE — xác nhận quy trình local với phường.`,
  },
  {
    procedure_name: "Đăng ký tạm trú / thông báo lưu trú",
    content: `Hồ sơ cần mang: Tờ khai; CCCD chủ nhà; giấy tờ chỗ ở.
Nơi nộp: UBND phường hoặc công an cấp xã theo phân định (verify local).
Thời gian giải quyết: Ngắn (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Cấp thẻ bảo hiểm y tế (tự nguyện / hộ gia đình)",
    content: `Hồ sơ cần mang: Tờ khai TK1-TS; CCCD; giấy tờ đối tượng ưu đãi nếu có.
Nơi nộp: UBND phường hoặc tổ thu BHYT / BHXH quận (verify).
Thời gian giải quyết: Theo lịch thu (SAMPLE).
Lệ phí: Mức đóng theo quy định hiện hành (SAMPLE — không tự invent số tiền).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Liên thông khai sinh – thường trú – BHYT trẻ dưới 6 tuổi",
    content: `Hồ sơ cần mang: Tờ khai khai sinh; giấy chứng sinh; CCCD cha/mẹ; tờ khai BHYT.
Nơi nộp: Bộ phận Một cửa UBND phường Cẩm Lệ.
Thời gian giải quyết: Rút gọn nếu đủ điều kiện (SAMPLE — verify).
Lệ phí: Miễn lệ phí đăng ký khai sinh.
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Cấp mới / đổi thẻ CCCD",
    content: `Nơi chính: Công an cấp huyện/thành phố — phường chỉ hướng dẫn, không cấp; không nộp tại phường.
Điều kiện: Đủ 14 tuổi; chưa có CCCD hoặc CCCD hết hạn / sai thông tin.
Hồ sơ: CCCD cũ (nếu đổi); giấy tờ nhân thân theo yêu cầu công an.
Thời gian: Theo lịch công an (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE — hướng dẫn, không tiếp nhận cấp CCCD tại phường.`,
  },
  {
    procedure_name: "Xác nhận cư trú / thông tin cư trú",
    content: `Khi CSDL tra được: dùng CCCD / định danh điện tử.
Khi không tra được: xuất trình CCCD hoặc giấy tờ cư trú theo Nghị định 104.
Nơi: UBND phường Cẩm Lệ hướng dẫn / xác nhận theo thực tiễn local (verify).
Thời gian: Ngắn nếu đủ giấy tờ (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Ghi chú tạm vắng",
    content: `Hồ sơ cần mang: Tờ khai.
Nơi nộp: Công an địa bàn theo phân định.
Thời gian giải quyết: Ngắn (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE.`,
  },
  {
    procedure_name: "Đề nghị hưởng trợ cấp xã hội / bảo trợ xã hội (hướng dẫn)",
    content: `Hồ sơ: Theo từng nhóm đối tượng (thu nhập thấp, người khuyết tật, người cao tuổi…) — cần xác nhận hoàn cảnh.
Nơi nộp: UBND phường tiếp nhận; Phòng LĐTB&XH xét.
Thời gian: Theo quy trình (SAMPLE).
Lệ phí: Miễn.
Ghi chú: SAMPLE — hướng dẫn chung, chi tiết hồ sơ theo từng nhóm; xác nhận với phường.`,
  },
];

async function main() {
  let inserted = 0;
  for (const p of PROCEDURES) {
    const { data: existing } = await supabase
      .from("admin_procedures")
      .select("id")
      .eq("procedure_name", p.procedure_name)
      .maybeSingle();
    if (existing) {
      console.log(`skip: ${p.procedure_name}`);
      continue;
    }
    const { error } = await supabase.from("admin_procedures").insert({
      procedure_name: p.procedure_name,
      content: p.content,
      embedding: null,
      is_active: true,
    });
    if (error) {
      console.error(`fail: ${p.procedure_name}: ${error.message}`);
      process.exitCode = 1;
    } else {
      inserted += 1;
      console.log(`ok: ${p.procedure_name}`);
    }
  }
  console.log(`done: ${inserted} new / ${PROCEDURES.length} total (embedding=null)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
