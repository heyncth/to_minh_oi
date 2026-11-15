/**
 * Generate the 5 Vietnamese voice-over MP3s for the 90s competition demo video.
 * Run: npm run demo:audio
 * Output: ~/.video-demo/tominhoi.vercel.app/audio/scene{1..5}.mp3
 */
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { EdgeTTS } from "@andresaya/edge-tts";

const OUT = join(homedir(), ".video-demo", "tominhoi.vercel.app", "audio");
const VOICE = "vi-VN-HoaiMyNeural";
const RATE = "+5%";

const SCENES: Array<[string, string]> = [
  [
    "scene1",
    "Thông báo tổ dân phố trên nhóm Zalo thường trôi nhanh và chữ nhỏ, khiến cô chú lớn tuổi khó theo dõi. Với Tổ Mình Ơi, người dân chỉ cần một chạm quét mã QR là mở ngay bảng tin số không cần cài đặt, hỗ trợ phóng to chữ rõ nét.",
  ],
  [
    "scene2",
    "Mỗi thông báo dài được AI chắt lọc thành ba ý ngắn gọn: tóm tắt chính, thời gian địa điểm và việc cần làm. Chỉ cần bấm nút nghe thông báo, trợ lý sẽ đọc to bằng tiếng Việt truyền cảm, đồng thời cho phép chia sẻ nhanh qua thẻ ảnh tích hợp sẵn mã QR.",
  ],
  [
    "scene3",
    "Chuyển sang tab Trợ lý, bà con có thể hỏi nhanh mọi thủ tục hành chính tại phường Cẩm Lệ. Hệ thống AI tra cứu trực tiếp dữ liệu chuẩn của phường để hướng dẫn chính xác giấy tờ cần mang, địa điểm nộp tại 135 Ông Ích Đường và lệ phí.",
  ],
  [
    "scene4",
    "Đặc biệt, ngay trong cùng một khung chat duy nhất, khi nhận được tin nhắn hay đường link lạ, bà con chỉ cần dán vào để kiểm tra. AI sẽ tự động phân tích và bật thẻ cảnh báo màu sắc trực quan, chỉ rõ dấu hiệu lừa đảo và cách xử lý an toàn.",
  ],
  [
    "scene5",
    "Vận hành hoàn toàn miễn phí, không lưu dữ liệu cá nhân của người dân. Tổ Mình Ơi – Gắn kết từng hộ dân, vững bước Cẩm Lệ số!",
  ],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const tts = new EdgeTTS({ timeout: 60_000 });
  for (const [name, text] of SCENES) {
    const result = await tts.generate(text, VOICE, {
      rate: RATE,
      outputFormat: "audio-24khz-48kbitrate-mono-mp3",
    });
    const audio = Buffer.from(result.audio);
    if (audio.length === 0) throw new Error(`${name}: empty audio`);
    const path = join(OUT, `${name}.mp3`);
    await writeFile(path, audio);
    console.log(`${name}.mp3  ${audio.length}B  ~${(result.duration ?? 0).toFixed(2)}s`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
