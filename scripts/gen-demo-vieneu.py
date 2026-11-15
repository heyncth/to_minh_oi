# Pre-generate the 5 demo-video voice-over files with VieNeu-TTS (local CPU, Apache-2.0).
# Demo video ONLY — app runtime keeps Web Speech + edge-tts MP3s untouched.
# Run: uv run --with vieneu python scripts/gen-demo-vieneu.py
# Output: ~/.video-demo/tominhoi.vercel.app/audio/scene{1..5}.mp3 (48k wav -> mp3)
# Narration texts: keep in sync with scripts/build-demo-video.mjs (subtitles)
import subprocess
from pathlib import Path
from vieneu import Vieneu

OUT = Path.home() / ".video-demo" / "tominhoi.vercel.app" / "audio"
VOICE = "Hải Đăng"
SPEED = 1.05  # matches edge-tts --rate +5%

SCENES = [
    (
        "scene1",
        "Ở các tổ dân phố, thông báo quan trọng trên nhóm Zalo thường trôi rất nhanh và chữ nhỏ, khiến cô chú lớn tuổi khó theo dõi. Với Tổ Mình Ơi, bà con chỉ cần một chạm quét mã QR là mở ngay bảng tin số của tổ, không cần tải ứng dụng hay đăng ký tài khoản, hỗ trợ phóng to chữ rõ nét chỉ bằng một nút bấm.",
    ),
    (
        "scene2",
        "Từ các bản tin phân loại rác của chương trình Cẩm Lệ xanh đến thông báo y tế, mỗi văn bản dài đều được trí tuệ nhân tạo tự động chắt lọc thành ba ý dễ hiểu: tóm tắt chính, thời gian địa điểm và việc cần làm. Cô chú chỉ cần bấm nút nghe thông báo để trợ lý đọc to truyền cảm, hoặc chia sẻ ngay thẻ ảnh tích hợp sẵn mã QR cho cả xóm cùng nắm bắt.",
    ),
    (
        "scene3",
        "Chuyển sang tab Trợ lý, người dân có thể hỏi đáp tức thì mọi thủ tục hành chính ngay tại địa phương. Hệ thống AI tra cứu trực tiếp từ kho dữ liệu chuẩn của phường Cẩm Lệ để hướng dẫn chính xác giấy tờ cần mang, lệ phí và địa điểm nộp tại số 135 Ông Ích Đường, giúp bà con không phải đi lại nhiều lần.",
    ),
    (
        "scene4",
        "Đặc biệt, ngay trong cùng một khung trò chuyện duy nhất, khi nhận được tin nhắn lạ như yêu cầu gửi mã OTP khóa tài khoản hay đường link đáng ngờ, bà con chỉ cần chọn nhanh mẫu thử hoặc dán vào để kiểm tra. AI sẽ tự động bật thẻ cảnh báo màu đỏ trực quan, chỉ rõ dấu hiệu giả mạo và hướng dẫn cách xử lý an toàn, bảo vệ người dân trước tội phạm công nghệ cao.",
    ),
    (
        "scene5",
        "Vận hành hoàn toàn miễn phí, bảo mật không lưu dữ liệu cá nhân và sẵn sàng nhân rộng tới mọi tổ dân phố trên địa bàn. Tổ Mình Ơi – Gắn kết từng hộ dân, vững bước Cẩm Lệ số!",
    ),
]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    tts = Vieneu()  # v3 Turbo, ONNX/CPU, torch-free; downloads model on first run
    print("voices:", len(tts.list_preset_voices()), "| using:", VOICE)
    for name, text in SCENES:
        wav_path = OUT / f"{name}.wav"
        mp3_path = OUT / f"{name}.mp3"
        audio = tts.infer(text, voice=VOICE, speed=SPEED)
        tts.save(audio, str(wav_path))
        # build-demo-video.mjs reads sceneN.mp3 — re-encode, same filename contract
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(wav_path), "-b:a", "128k", str(mp3_path)],
            check=True,
            capture_output=True,
        )
        wav_path.unlink()
        print(f"{name}.mp3  {mp3_path.stat().st_size}B")


if __name__ == "__main__":
    main()
