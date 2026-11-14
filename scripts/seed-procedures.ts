/**
 * P0.8 — insert/update 12 SAMPLE procedures.
 * Run: npm run seed:procedures
 * Upserts by procedure_name; sets embedding=null when content changes so
 * `npx tsx scripts/embed-procedures.ts` can re-embed.
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
    content: `Hồ sơ cần mang: Tờ khai đăng ký khai sinh (mẫu do UBND phát); Giấy chứng sinh do cơ sở y tế cấp; CCCD/CMND của cha hoặc mẹ; Giấy chứng nhận kết hôn của cha mẹ (nếu đã đăng ký); nếu trẻ sinh ngoài giá thú cần thêm giấy tờ xác nhận quan hệ cha mẹ theo quy định.
Nơi nộp: Bộ phận tiếp nhận và trả kết quả – UBND phường Cẩm Lệ (Thứ Hai đến Thứ Sáu, sáng thứ Bảy theo giờ hành chính).
Thời gian giải quyết: Đăng ký ngay trong ngày nếu hồ sơ đủ và nộp trước 15 giờ; trường hợp thiếu giấy tờ hoặc nộp sau 15 giờ thì giải quyết vào ngày làm việc tiếp theo (tham khảo quy định hiện hành).
Lệ phí: Miễn lệ phí đăng ký khai sinh.
Quy trình: Nộp hồ sơ → nhân viên kiểm tra → nhập CSDL hộ tịch → trả kết quả (giấy khai sinh/bản sao trích lục) cho người đến nhận hoặc qua dịch vụ công.
Ghi chú: SAMPLE — một số nội dung đã thực hiện trực tuyến qua Cổng dịch vụ công / VNeID; nên hỏi trước khi đến. Trẻ chưa đặt tên, khai họ tên khác họ cha mẹ cần mang thêm đơn giải trình.`,
  },
  {
    procedure_name: "Đăng ký khai tử",
    content: `Hồ sơ cần mang: Tờ khai đăng ký khai tử; Giấy báo tử hoặc hồ sơ bệnh viện / giấy xác nhận của cơ sở y tế, pháp y; CCCD của người khai; giấy tờ nhân thân của người đã chết (nếu có).
Nơi nộp: UBND phường Cẩm Lệ — Bộ phận tiếp nhận và trả kết quả.
Thời gian giải quyết: Theo quy định hiện hành; thường giải quyết trong ngày nếu hồ sơ đủ (SAMPLE — xác nhận với phường).
Lệ phí: Miễn lệ phí đăng ký khai tử.
Quy trình: Nộp hồ sơ → kiểm tra → ghi vào sổ hộ tịch → trả kết quả cho người khai.
Ghi chú: SAMPLE. Thời điểm đăng ký chậm nhất theo pháp luật hiện hành — cần phường hướng dẫn cụ thể từng trường hợp (tử vong tại nhà, tại cơ sở y tế, chưa rõ danh tính).`,
  },
  {
    procedure_name: "Cấp bản sao trích lục hộ tịch",
    content: `Hồ sơ cần mang: Đơn/yêu cầu cấp bản sao trích lục hộ tịch (có mẫu); CCCD; thông tin đăng ký hộ tịch liên quan (họ tên, ngày sinh, nơi đăng ký trước đó) để tra cứu.
Nơi nộp: UBND phường Cẩm Lệ (nơi đã đăng ký hộ tịch) hoặc cơ quan có thẩm quyền theo phân định.
Thời gian giải quyết: Nhận ngay nếu tra được hồ sơ và trong giờ hành chính; trường hợp phải tra cứu kho lưu trữ thì theo hẹn (SAMPLE).
Lệ phí: Theo quy định hiện hành (SAMPLE — xác nhận với phường; có trường hợp miễn với người cao tuổi, hộ nghèo).
Ghi chú: SAMPLE. Cần bản sao để làm CCCD, vay vốn, thừa kế… thì ghi rõ mục đích trên đơn.`,
  },
  {
    procedure_name: "Giấy xác nhận tình trạng hôn nhân",
    content: `Hồ sơ cần mang: Đơn yêu cầu xác nhận tình trạng hôn nhân (mẫu); CCCD; bản sao hộ tịch liên quan (giấy khai sinh, sổ hộ tịch) nếu có; trong một số trường hợp cần xác nhận của tổ dân phố về nơi cư trú.
Nơi nộp: UBND phường Cẩm Lệ (hoặc cấp huyện tùy quy định hiện hành — verify local).
Thời gian giải quyết: Theo quy định hiện hành; thường trong vài ngày làm việc nếu hồ sơ đủ (SAMPLE).
Lệ phí: Miễn hoặc một phần theo quy định (SAMPLE — xác nhận với phường).
Ghi chú: SAMPLE. Mục đích phổ biến: đăng ký kết hôn, ly hôn, làm thủ tục nước ngoài, thừa kế. Cần mang đúng nơi đăng ký khai sinh/hộ tịch trước đây nếu đã chuyển nơi cư trú.`,
  },
  {
    procedure_name: "Đăng ký thường trú",
    content: `Hồ sơ cần mang: Tờ khai đăng ký thường trú; giấy tờ chỗ ở hợp pháp (sổ đỏ, hợp đồng thuê, xác nhận của chủ nhà…); CCCD; giấy tờ nhân thân liên quan; trong nhiều trường hợp khai thác CSDL dân cư qua VNeID thay vì sổ hộ khẩu giấy.
Nơi nộp: UBND phường Cẩm Lệ / CSDL dân cư – VNeID theo hướng dẫn hiện hành.
Thời gian giải quyết: Theo quy định hiện hành; nhiều nội dung rút ngắn do khai thác CSDL, không bắt buộc sổ hộ khẩu giấy (từ 2023).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE — xác nhận quy trình local với phường. Người thuê nhà cần chủ nhà cùng đến hoặc có ủy quyền hợp lệ.`,
  },
  {
    procedure_name: "Đăng ký tạm trú / thông báo lưu trú",
    content: `Hồ sơ cần mang: Tờ khai tạm trú / thông báo lưu trú; CCCD chủ nhà hoặc người quản lý chỗ ở; giấy tờ nhân thân người tạm trú; giấy tờ chỗ ở.
Nơi nộp: UBND phường hoặc công an cấp xã theo phân định (verify local).
Thời gian giải quyết: Ngắn nếu đủ giấy tờ (SAMPLE — thường trong ngày).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE. Lưu trú ngắn hạn (dưới 30 ngày) có thể chỉ cần thông báo; tạm trú dài hơn cần đăng ký. Chủ nhà chịu trách nhiệm thông báo.`,
  },
  {
    procedure_name: "Cấp thẻ bảo hiểm y tế (tự nguyện / hộ gia đình)",
    content: `Hồ sơ cần mang: Tờ khai tham gia BHYT (mẫu TK1-TS); CCCD hoặc giấy khai sinh (trẻ em); giấy tờ đối tượng ưu đãi nếu có (người cao tuổi, hộ nghèo, thương binh…).
Nơi nộp: UBND phường hoặc tổ thu BHYT / BHXH quận theo lịch (verify local).
Thời gian giải quyết: Theo lịch thu; thẻ cấp sau khi đóng phí và nhập dữ liệu (SAMPLE).
Lệ phí: Mức đóng theo quy định hiện hành (SAMPLE — không tự invent số tiền; hỏi tổ thu BHYT).
Ghi chú: SAMPLE. Hộ gia đình nộp danh sách kèm nhau; người già, trẻ nhỏ cần CCCD/giấy khai sinh. Gia hạn trước ngày thẻ hết hạn để không gián đoạn quyền lợi.`,
  },
  {
    procedure_name: "Liên thông khai sinh – thường trú – BHYT trẻ dưới 6 tuổi",
    content: `Hồ sơ cần mang: Tờ khai khai sinh; giấy chứng sinh; CCCD cha/mẹ; tờ khai BHYT (nếu muốn cấp cùng); thông tin nơi cư trú để đăng ký thường trú.
Nơi nộp: Bộ phận Một cửa UBND phường Cẩm Lệ — làm một lần, nhiều ngành xử lý.
Thời gian giải quyết: Rút gọn nếu đủ điều kiện và CSDL liên thông hoạt động (SAMPLE — verify).
Lệ phí: Miễn lệ phí đăng ký khai sinh; phí BHYT theo quy định.
Quy trình: Nộp một bộ hồ sơ → tiếp nhận liên thông → trả kết quả giấy khai sinh, thông tin cư trú, thẻ BHYT (hoặc hướng dẫn nhận thẻ).
Ghi chú: SAMPLE. Ưu tiên cho trẻ dưới 6 tuổi; nên làm ngay sau khi sinh để hưởng đầy đủ.`,
  },
  {
    procedure_name: "Cấp mới / đổi thẻ CCCD",
    content: `Nơi chính: Công an cấp huyện/thành phố — phường chỉ hướng dẫn, không cấp; không nộp tại phường.
Điều kiện: Đủ 14 tuổi; chưa có CCCD hoặc CCCD hết hạn / sai thông tin cần đổi.
Hồ sơ: CCCD cũ (nếu đổi); giấy tờ nhân thân theo yêu cầu công an; ảnh (nếu công an chưa chụp tại chỗ).
Thời gian: Theo lịch công an (SAMPLE — thường vài ngày đến vài tuần).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE — hướng dẫn, không tiếp nhận cấp CCCD tại phường. Hộ khẩu, khai sinh liên quan vẫn tra qua CSDL. Khi đổi CCCD cần cập nhật thông tin ngân hàng, BHYT nếu cần.`,
  },
  {
    procedure_name: "Xác nhận cư trú / thông tin cư trú",
    content: `Khi CSDL tra được: dùng CCCD / định danh điện tử VNeID — không cần bản giấy trong nhiều trường hợp.
Khi không tra được: xuất trình CCCD hoặc giấy tờ cư trú theo Nghị định 104; có thể cần xác nhận của tổ dân phố về nơi ở thực tế.
Nơi: UBND phường Cẩm Lệ hướng dẫn / xác nhận theo thực tiễn local (verify).
Thời gian: Ngắn nếu đủ giấy tờ (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE. Dùng khi vay vốn, đăng ký kết hợp, làm CCCD, xác nhận nơi cư trú cho con đi học. Mang CCCD và biết rõ địa chỉ cũ/mới nếu đã chuyển nơi.`,
  },
  {
    procedure_name: "Ghi chú tạm vắng",
    content: `Hồ sơ cần mang: Tờ khai tạm vắng (mẫu); CCCD; trong một số nơi cần xác nhận của tổ dân phố.
Nơi nộp: Công an địa bàn theo phân định (công an phường/trạm).
Thời gian giải quyết: Ngắn nếu đủ giấy tờ (SAMPLE).
Lệ phí: Theo quy định (SAMPLE).
Ghi chú: SAMPLE. Người rời địa phương dài ngày nên ghi tạm vắng để tránh phát sinh nghĩa vụ cư trú; khi trở về có thể cần ghi lại nơi ở.`,
  },
  {
    procedure_name: "Đề nghị hưởng trợ cấp xã hội / bảo trợ xã hội (hướng dẫn)",
    content: `Hồ sơ: Theo từng nhóm đối tượng (thu nhập thấp, người khuyết tật, người cao tuổi neo đơn, trẻ em có hoàn cảnh đặc biệt…) — cần xác nhận hoàn cảnh, hồ sơ y tế/xã hội theo nhóm.
Nơi nộp: UBND phường tiếp nhận; Phòng LĐTB&XH quận/thành phố xét duyệt.
Thời gian: Theo quy trình (SAMPLE — vài tuần tùy nhóm).
Lệ phí: Miễn.
Quy trình: Nộp đơn tại Một cửa → phường xác nhận hoàn cảnh → chuyển phòng LĐTB&XH → xét và trả kết quả/tháng.
Ghi chú: SAMPLE — hướng dẫn chung, chi tiết hồ sơ theo từng nhóm; phải xác nhận với phường. Mang CCCD, sổ hộ gia đình, giấy xác nhận khuyết tật/hoàn cảnh nếu có.`,
  },
];

async function main() {
  let touched = 0;
  for (const p of PROCEDURES) {
    const { data: existing } = await supabase
      .from("admin_procedures")
      .select("id,content,embedding")
      .eq("procedure_name", p.procedure_name)
      .maybeSingle();

    if (existing) {
      if (existing.content === p.content) {
        console.log(`skip (same): ${p.procedure_name}`);
        continue;
      }
      const { error } = await supabase
        .from("admin_procedures")
        .update({
          content: p.content,
          // force re-embed when content changes
          embedding: null,
          is_active: true,
        })
        .eq("id", existing.id);
      if (error) {
        console.error(`fail update: ${p.procedure_name}: ${error.message}`);
        process.exitCode = 1;
      } else {
        touched += 1;
        console.log(`update (re-embed): ${p.procedure_name}`);
      }
      continue;
    }

    const { error } = await supabase.from("admin_procedures").insert({
      procedure_name: p.procedure_name,
      content: p.content,
      embedding: null,
      is_active: true,
    });
    if (error) {
      console.error(`fail insert: ${p.procedure_name}: ${error.message}`);
      process.exitCode = 1;
    } else {
      touched += 1;
      console.log(`insert: ${p.procedure_name}`);
    }
  }
  console.log(`done: ${touched} changed / ${PROCEDURES.length} total (embedding null where changed)`);
  if (touched > 0) {
    console.log("next: npx tsx scripts/embed-procedures.ts");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
