/**
 * P0 seed companion — insert/update 6 SAMPLE announcements (published).
 * Run: npm run seed:announcements
 * Upserts by title; deletes previous seed titles no longer used.
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
    title: "Tiêm chủng mở rộng cho trẻ em tháng 12/2026",
    category: "Y tế",
    is_urgent: true,
    summary_main:
      "Trạm Y tế phường Cẩm Lệ tổ chức tiêm chủng mở rộng định kỳ tháng 12 cho trẻ em trong độ tuổi theo chương trình miễn phí của thành phố. Cha mẹ đưa trẻ đến đúng điểm trạm phụ trách khu vực; nhân viên y tế sẽ khám sàng lọc, đo thân nhiệt và tư vấn trước khi tiêm.",
    summary_time_location:
      "07:30–11:00, các ngày tiêm chủng định kỳ trong tháng 12/2026; tại Trạm Y tế phường Cẩm Lệ (Tổ 10 đường Cầu Đỏ - Túy Loan) và các điểm trạm: Điểm Trạm Cẩm Lệ 1 (28 Trần Ngọc Sương), Điểm Trạm Cẩm Lệ 2 (68 Lương Văn Can). Lịch cụ thể từng tổ dân phố sẽ thông báo trước 02 ngày.",
    summary_action_required:
      "Mang theo Sổ tiêm chủng cá nhân, Giấy khai sinh hoặc mã định danh/CCCD của trẻ; trẻ đang sốt, đang dùng thuốc kháng sinh hoặc có tiền sử phản ứng nặng với mũi tiêm trước cần báo ngay cho bác sĩ để hoãn tiêm. Ở lại điểm trạm theo dõi ít nhất 30 phút sau tiêm.",
    original_text:
      "UBND PHƯỜNG CẨM LỆ\nTRẠM Y TẾ PHƯỜNG\n---\nTHÔNG BÁO LỊCH TIÊM CHỦNG MỞ RỘNG THÁNG 12/2026\n\nCăn cứ Kế hoạch triển khai Chương trình Tiêm chủng mở rộng năm 2026 của ngành Y tế thành phố Đà Nẵng, Trạm Y tế phường Cẩm Lệ thông báo lịch tiêm chủng định kỳ cho trẻ em trong độ tuổi trên địa bàn phường:\n1. Thời gian: Từ 07h30 đến 11h00 các buổi sáng theo lịch phân bổ từng cụm dân cư.\n2. Địa điểm: Trạm Y tế phường Cẩm Lệ (Tổ 10 đường Cầu Đỏ - Túy Loan), Điểm Trạm Cẩm Lệ 1 (số 28 Trần Ngọc Sương) và Điểm Trạm Cẩm Lệ 2 (số 68 Lương Văn Can).\n3. Lưu ý: Phụ huynh mang theo Sổ tiêm chủng và Giấy khai sinh của trẻ. Trẻ có biểu hiện sốt hoặc đang điều trị bệnh cấp tính cần thông báo cho cán bộ y tế để được xếp lịch tiêm vét.\n[Dữ liệu mẫu phục vụ demo – Cần đối chiếu lịch phân bổ cụ thể của Trạm Y tế phường]",
  },
  {
    title: "Ra quân tổng vệ sinh môi trường, diệt lăng quăng phòng sốt xuất huyết",
    category: "Môi trường",
    is_urgent: false,
    summary_main:
      "Hưởng ứng chương trình “Cẩm Lệ xanh” và cao điểm phòng chống dịch sốt xuất huyết mùa mưa cuối năm, UBND phường phát động tổng vệ sinh môi trường, khơi thông cống rãnh và diệt lăng quăng/bọ gậy tại tất cả các khu dân cư.",
    summary_time_location:
      "06:30–08:30 sáng Thứ Bảy hằng tuần; tập trung tại Nhà văn hóa hoặc điểm sinh hoạt cộng đồng của từng Tổ dân phố trên địa bàn phường Cẩm Lệ.",
    summary_action_required:
      "Mỗi hộ gia đình chủ động lật úp dụng cụ chứa nước không dùng đến, thay nước bình hoa, thu gom lốp xe cũ, chai lọ đọng nước quanh nhà và tham gia dọn dẹp tuyến kiệt/hẻm cùng tổ dân phố. Hộ neo đơn hoặc đi vắng báo Tổ trưởng để lực lượng đoàn viên hỗ trợ.",
    original_text:
      "ỦY BAN NHÂN DÂN PHƯỜNG CẨM LỆ\n---\nTHÔNG BÁO RA QUÂN TỔNG VỆ SINH MÔI TRƯỜNG PHÒNG CHỐNG SỐT XUẤT HUYẾT\n\nThực hiện Kế hoạch triển khai chương trình “Cẩm Lệ xanh” và công tác chủ động phòng chống dịch sốt xuất huyết từ khu dân cư năm 2026, UBND phường đề nghị các Tổ dân phố và toàn thể Nhân dân thực hiện:\n1. Thời gian: Từ 06h30 sáng Thứ Bảy hằng tuần.\n2. Nội dung: Tổ chức ra quân khơi thông cống rãnh, phát quang bụi rậm, thu gom rác thải tồn đọng tại các kiệt, hẻm; kiểm tra và loại bỏ triệt để các vật dụng chứa nước có lăng quang, bọ gậy trong khuôn viên từng hộ gia đình.\n3. Tổ chức thực hiện: Tổ trưởng Tổ dân phố phối hợp với Ban Công tác Mặt trận và Chi đoàn thanh niên đôn đốc các hộ gia đình tham gia đầy đủ.\n[Dữ liệu mẫu phục vụ demo]",
  },
  {
    title: "Khám sức khỏe nghĩa vụ quân sự và nghĩa vụ Công an nhân dân năm 2027",
    category: "Hành chính",
    is_urgent: true,
    summary_main:
      "UBND phường Cẩm Lệ thông báo danh sách và tổ chức điều động nam công dân trong độ tuổi đủ điều kiện tham gia khám sức khỏe nghĩa vụ quân sự và nghĩa vụ tham gia Công an nhân dân năm 2027 theo quy định.",
    summary_time_location:
      "Theo thời gian ghi cụ thể trên Lệnh gọi khám sức khỏe; tiếp nhận hướng dẫn hồ sơ tại Trung tâm Phục vụ hành chính công / Trụ sở UBND phường Cẩm Lệ (số 135 Ông Ích Đường, điện thoại: 0236.3879272) trong giờ hành chính.",
    summary_action_required:
      "Công dân có mặt đúng giờ quy định, mang theo Lệnh gọi khám sức khỏe, thẻ CCCD gắn chip, Giấy xác nhận thông tin cư trú (nếu cần) và 02 ảnh 4x6 nền trắng. Trường hợp công dân đang đi làm ăn xa hoặc thuộc diện tạm hoãn phải liên hệ ngay Ban Chỉ huy Quân sự phường và Tổ trưởng để nộp giấy tờ xác minh đúng hạn.",
    original_text:
      "ỦY BAN NHÂN DÂN PHƯỜNG CẨM LỆ\nHỘI ĐỒNG NGHĨA VỤ QUÂN SỰ\n---\nTHÔNG BÁO VỀ VIỆC KHÁM SỨC KHỎE NGHĨA VỤ QUÂN SỰ VÀ NGHĨA VỤ THAM GIA CÔNG AN NHÂN DÂN NĂM 2027\n\nCăn cứ Thông báo của UBND phường Cẩm Lệ về danh sách công dân được miễn, tạm hoãn và đủ điều kiện gọi khám sức khỏe nghĩa vụ quân sự, nghĩa vụ tham gia Công an nhân dân năm 2027:\n1. Đối tượng: Nam công dân trong độ tuổi sẵn sàng nhập ngũ có hộ khẩu thường trú tại phường Cẩm Lệ đã nhận Lệnh gọi khám sức khỏe.\n2. Thủ tục mang theo: Lệnh gọi khám sức khỏe, Căn cước công dân, các giấy tờ liên quan đến sức khỏe (nếu có).\n3. Liên hệ giải đáp: Mọi thắc mắc về hồ sơ tạm hoãn hoặc lịch khám, công dân và gia đình liên hệ trực tiếp Ban Chỉ huy Quân sự phường tại trụ sở UBND phường Cẩm Lệ (số 135 Ông Ích Đường) hoặc qua số điện thoại trực ban 0236.3879272.\n[Dữ liệu mẫu phục vụ demo dựa trên thông báo thực tế tháng 11/2026 của phường]",
  },
  {
    title: "Cảnh báo thủ đoạn lừa đảo mạo danh Công an, Điện lực và Ngân hàng",
    category: "An ninh",
    is_urgent: true,
    summary_main:
      "Công an phường Cẩm Lệ cảnh báo tình trạng kẻ gian gọi điện, nhắn tin Zalo mạo danh Công an hướng dẫn cập nhật định danh VNeID, nhân viên Điện lực dọa cắt điện hoặc nhân viên Ngân hàng báo khóa tài khoản để dụ người dân bấm vào link lạ cài ứng dụng độc hại và chiếm đoạt tiền.",
    summary_time_location:
      "Diễn ra liên tục qua điện thoại, tin nhắn SMS và mạng xã hội Zalo, đặc biệt nhắm vào người cao tuổi và người ít sử dụng công nghệ ở các khu dân cư.",
    summary_action_required:
      "Tuyệt đối không bấm vào đường link lạ, không tải file cài đặt (.apk), không cung cấp mã OTP hay mật khẩu ngân hàng cho bất kỳ ai qua điện thoại. Cơ quan Công an và Nhà nước không làm việc qua Zalo hay yêu cầu chuyển tiền xác minh. Khi nghi ngờ, dán tin nhắn vào mục “Trợ lý” trên app để kiểm tra hoặc báo ngay Công an phường Cẩm Lệ.",
    original_text:
      "CÔNG AN PHƯỜNG CẨM LỆ\nTỔ CÔNG NGHỆ SỐ CỘNG ĐỒNG VÀ ĐỀ ÁN 06\n---\nTHÔNG BÁO CẢNH BÁO THỦ ĐOẠN LỪA ĐẢO TRÊN KHÔNG GIAN MẠNG\n\nHiện nay trên địa bàn xuất hiện nhiều đối tượng giả danh cán bộ Công an phường yêu cầu người dân “kích hoạt định danh điện tử mức 2”, giả danh nhân viên Điện lực thông báo “nợ tiền điện sắp bị cắt điện trong 2 giờ” hoặc giả danh Ngân hàng yêu cầu “xác thực sinh trắc học”.\n- Thủ đoạn: Gửi đường link giả mạo giao diện cơ quan nhà nước, hướng dẫn cài đặt ứng dụng chứa mã độc (file .apk) nhằm chiếm quyền điều khiển điện thoại và rút sạch tiền trong tài khoản.\n- Khuyến cáo: Người dân tuyệt đối không làm theo hướng dẫn qua điện thoại; mọi thủ tục hành chính và định danh điện tử chỉ thực hiện trực tiếp tại trụ sở Công an phường hoặc Trung tâm Phục vụ hành chính công (135 Ông Ích Đường).\n[Dữ liệu mẫu phục vụ demo]",
  },
  {
    title: "Hội chợ Xuân & Gian hàng bình ổn giá phục vụ Tết Nguyên đán",
    category: "Sự kiện",
    is_urgent: false,
    summary_main:
      "UBND phường Cẩm Lệ phối hợp các đơn vị tổ chức Hội chợ Xuân giới thiệu sản phẩm OCOP, đặc sản địa phương, hoa cây cảnh và các gian hàng bình ổn giá phục vụ Nhân dân vui Xuân đón Tết. Chương trình có biểu diễn văn nghệ quần chúng miễn phí hằng đêm.",
    summary_time_location:
      "08:00–21:00, trong 03 ngày cuối tháng Chạp (lịch chính thức cập nhật trước 01 tuần); tại Khu vực Nhà văn hóa / Trung tâm Cung ứng dịch vụ sự nghiệp công phường Cẩm Lệ.",
    summary_action_required:
      "Người dân tham quan, mua sắm gửi xe đúng khu vực quy định của Ban Tổ chức, giữ gìn vệ sinh chung và trông coi tư trang, trẻ nhỏ nơi đông người. Các hộ kinh doanh trên địa bàn có nhu cầu đăng ký gian hàng trưng bày liên hệ Phòng Kinh tế, Hạ tầng và Đô thị phường.",
    original_text:
      "ỦY BAN NHÂN DÂN PHƯỜNG CẨM LỆ\n---\nTHÔNG BÁO TỔ CHỨC HỘI CHỢ XUÂN PHỤC VỤ NHÂN DÂN\n\nNhằm tạo không khí vui tươi, phấn khởi đón Tết cổ truyền và kết nối tiêu thụ sản phẩm của các hộ kinh doanh, cơ sở sản xuất trên địa bàn phường, UBND phường Cẩm Lệ tổ chức Hội chợ Xuân với các gian hàng đặc sản, hàng Việt Nam chất lượng cao và chương trình văn nghệ cộng đồng.\n1. Thời gian: Từ 08h00 đến 21h00 hằng ngày (dự kiến 03 ngày cuối tháng Chạp).\n2. Địa điểm: Khuôn viên Nhà văn hóa phường Cẩm Lệ.\n3. Đăng ký gian hàng: Các hộ kinh doanh, hợp tác xã trên địa bàn phường đăng ký trực tiếp tại Phòng Kinh tế, Hạ tầng và Đô thị phường Cẩm Lệ (số 135 Ông Ích Đường).\n[Dữ liệu mẫu phục vụ demo]",
  },
  {
    title: "Thu gom rác thải nguy hại và thiết bị điện tử cũ tại khu dân cư",
    category: "Môi trường",
    is_urgent: false,
    summary_main:
      "Thực hiện mô hình phân loại rác tại nguồn thuộc chương trình “Cẩm Lệ xanh”, phường tổ chức tiếp nhận pin đã qua sử dụng, bóng đèn huỳnh quang hỏng, ắc-quy và thiết bị điện tử cũ để bàn giao đơn vị chuyên trách xử lý an toàn, không thu phí.",
    summary_time_location:
      "14:00–17:00 chiều Thứ Năm hằng tuần; tại điểm tập kết phân loại rác nguy hại (khu vực sân trụ sở UBND phường Cẩm Lệ – 135 Ông Ích Đường và các điểm thu gom của Hội Liên hiệp Phụ nữ tổ dân phố).",
    summary_action_required:
      "Phân loại riêng pin, bóng đèn và rác điện tử tại nhà, không bỏ chung vào thùng rác sinh hoạt hằng ngày; bọc kỹ các bóng đèn vỡ hoặc pin bị rò rỉ trước khi mang đến điểm thu gom và báo cho cán bộ tiếp nhận.",
    original_text:
      "ỦY BAN NHÂN DÂN PHƯỜNG CẨM LỆ\nCHƯƠNG TRÌNH “CẨM LỆ XANH”\n---\nTHÔNG BÁO LỊCH THU GOM RÁC THẢI NGUY HẠI VÀ RÁC THẢI ĐIỆN TỬ\n\nNhằm giảm thiểu ô nhiễm môi trường đất, nguồn nước và thực hiện hiệu quả công tác phân loại chất thải rắn sinh hoạt tại nguồn trên địa bàn phường Cẩm Lệ:\n1. Danh mục tiếp nhận: Pin các loại đã qua sử dụng, bóng đèn huỳnh quang/compact hỏng, bình ắc-quy cũ, điện thoại, sạc, linh kiện và thiết bị điện tử gia dụng hư hỏng.\n2. Thời gian & Địa điểm: Từ 14h00 đến 17h00 chiều Thứ Năm hằng tuần tại điểm thu gom đặt ở trụ sở UBND phường Cẩm Lệ (135 Ông Ích Đường) hoặc thông qua mô hình thu gom của Chi hội Phụ nữ tại các khu dân cư.\n3. Lưu ý: Không vứt chung pin và thiết bị điện tử vào rác thải sinh hoạt thông thường.\n[Dữ liệu mẫu phục vụ demo]",
  },
];

/** Previous seed titles to remove when replaced by richer set. */
const LEGACY_TITLES = [
  "Tiêm chủng mở rộng cho trẻ em tháng 12",
  "Tổng vệ sinh môi trường phòng chống dịch sốt xuất huyết",
  "Đăng ký khám sức khỏe nghĩa vụ quân sự",
  "Cảnh báo lừa đảo giả mạo ngân hàng",
  "Hội chợ Tết tại Nhà văn hóa phường",
  "Điểm thu gom rác thải điện tử",
];

async function main() {
  let createdBy: string | null = null;
  if (adminEmail) {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (!error) {
      createdBy = data.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase())?.id ?? null;
    }
  }

  let upserted = 0;
  for (const a of ANNOUNCEMENTS) {
    const { data: existing } = await supabase
      .from("announcements")
      .select("id")
      .eq("title", a.title)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("announcements")
        .update({
          ...a,
          is_published: true,
          audio_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) {
        console.error(`fail update: ${a.title}: ${error.message}`);
        process.exitCode = 1;
      } else {
        upserted += 1;
        console.log(`update: ${a.title}`);
      }
      continue;
    }

    const { error } = await supabase.from("announcements").insert({
      ...a,
      is_published: true,
      audio_url: null,
      created_by: createdBy,
    });
    if (error) {
      console.error(`fail insert: ${a.title}: ${error.message}`);
      process.exitCode = 1;
    } else {
      upserted += 1;
      console.log(`insert: ${a.title}`);
    }
  }

  // drop old seed rows (titles no longer in ANNOUNCEMENTS)
  const keep = new Set(ANNOUNCEMENTS.map((a) => a.title));
  for (const title of LEGACY_TITLES) {
    if (keep.has(title)) continue;
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("title", title)
      .eq("is_published", true);
    if (error) {
      console.error(`fail delete legacy: ${title}: ${error.message}`);
      process.exitCode = 1;
    } else {
      console.log(`delete legacy: ${title}`);
    }
  }

  console.log(`done: ${upserted}/${ANNOUNCEMENTS.length} announcements upserted`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
