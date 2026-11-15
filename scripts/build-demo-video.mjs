/**
 * Compose the 90s demo video: 1920x1080 canvas (#F4F7FB), phone mockup with the
 * filmed 390x844 clips, scene title + wrapped Vietnamese subtitle on the right,
 * scene5 full-screen end card, edge-tts voice-over per scene.
 * Run: npm run demo:build   (needs demo-out/light/*.mp4 + audio/*.mp3)
 * Narration texts: keep in sync with scripts/gen-demo-vieneu.py
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, relative } from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const WS = join(homedir(), ".video-demo", "tominhoi.vercel.app");
const CLIPS = join(WS, "demo-out", "light");
const AUDIO = join(WS, "audio");
const TMP = join(WS, "demo-out", "composed");
const TXT = join(ROOT, "demo-out", "composed"); // filter-safe relative paths
const OUT = join(ROOT, "public", "demo-to-minh-oi.mp4");

const W = 1920;
const H = 1080;
const PHONE_W = 448;
const PHONE_H = 971;
const PHONE_X = 120;
const PHONE_Y = 55;
const PANEL_X = 650;

const SCENES = [
  {
    id: "scene1",
    title: "Bảng tin rõ ràng, chữ to dễ đọc",
    text: "Ở các tổ dân phố, thông báo quan trọng trên nhóm Zalo thường trôi rất nhanh và chữ nhỏ, khiến cô chú lớn tuổi khó theo dõi. Với Tổ Mình Ơi, bà con chỉ cần một chạm quét mã QR là mở ngay bảng tin số của tổ, không cần tải ứng dụng hay đăng ký tài khoản, hỗ trợ phóng to chữ rõ nét chỉ bằng một nút bấm.",
  },
  {
    id: "scene2",
    title: "Nghe thông báo bằng giọng đọc",
    text: "Từ các bản tin phân loại rác của chương trình Cẩm Lệ xanh đến thông báo y tế, mỗi văn bản dài đều được trí tuệ nhân tạo tự động chắt lọc thành ba ý dễ hiểu: tóm tắt chính, thời gian địa điểm và việc cần làm. Cô chú chỉ cần bấm nút nghe thông báo để trợ lý đọc to truyền cảm, hoặc chia sẻ ngay thẻ ảnh tích hợp sẵn mã QR cho cả xóm cùng nắm bắt.",
  },
  {
    id: "scene3",
    title: "Hỏi đáp thủ tục hành chính",
    text: "Chuyển sang tab Trợ lý, người dân có thể hỏi đáp tức thì mọi thủ tục hành chính ngay tại địa phương. Hệ thống AI tra cứu trực tiếp từ kho dữ liệu chuẩn của phường Cẩm Lệ để hướng dẫn chính xác giấy tờ cần mang, lệ phí và địa điểm nộp tại số 135 Ông Ích Đường, giúp bà con không phải đi lại nhiều lần.",
  },
  {
    id: "scene4",
    title: "Kiểm tra tin nhắn lạ",
    text: "Đặc biệt, ngay trong cùng một khung trò chuyện duy nhất, khi nhận được tin nhắn lạ như yêu cầu gửi mã OTP khóa tài khoản hay đường link đáng ngờ, bà con chỉ cần chọn nhanh mẫu thử hoặc dán vào để kiểm tra. AI sẽ tự động bật thẻ cảnh báo màu đỏ trực quan, chỉ rõ dấu hiệu giả mạo và hướng dẫn cách xử lý an toàn, bảo vệ người dân trước tội phạm công nghệ cao.",
  },
];

const ffprobe = (file) =>
  execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    { encoding: "utf8" },
  ).trim();

const wrap = (text, max) => {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    if ((line + " " + word).trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join("\n");
};

async function makeBezel(path) {
  // 8px ring, outer r40, inner r28 — thin enough not to eat the bottom-tab corners
  const bw = PHONE_W + 16;
  const bh = PHONE_H + 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bw}" height="${bh}">
    <path fill="#1E293B" fill-rule="evenodd"
      d="M40,0 h${bw - 80} a40,40 0 0 1 40,40 v${bh - 80} a40,40 0 0 1 -40,40 h-${bw - 80} a40,40 0 0 1 -40,-40 v-${bh - 80} a40,40 0 0 1 40,-40 z
         M36,8 h${PHONE_W - 56} a28,28 0 0 1 28,28 v${PHONE_H - 56} a28,28 0 0 1 -28,28 h-${PHONE_W - 56} a28,28 0 0 1 -28,-28 v-${PHONE_H - 56} a28,28 0 0 1 28,-28 z"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(path);
}

function drawtext(file, { font, size, color, x, y, spacing = 0 }) {
  // filter-graph args cannot hold Windows absolute paths (':' + '\\') — use repo-relative
  const tf = relative(ROOT, file).replace(/\\/g, "/");
  return `drawtext=fontfile=${font}:textfile=${tf}:fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}:line_spacing=${spacing}:reload=1`;
}

function composeScene({ clip, audio, titleFile, subFile, bezel, duration, out }) {
  const title = titleFile;
  const sub = subFile;
  const fontBold = "fonts/BeVietnamPro-Bold.ttf";
  const fontReg = "fonts/BeVietnamPro-Regular.ttf";
  const fc = [
    `[0:v]scale=${PHONE_W}:${PHONE_H}:flags=lanczos,setsar=1,fps=30,format=yuv420p[ph]`,
    `color=c=0xF4F7FB:s=${W}x${H}:r=30:d=9999,format=yuv420p[bg]`,
    [
      `[bg][ph]overlay=${PHONE_X}:${PHONE_Y}`,
      `drawbox=x=${PANEL_X}:y=278:w=140:h=10:color=0x0B5CAB:t=fill`,
      drawtext(title, { font: fontBold, size: 72, color: "0x0F172A", x: PANEL_X, y: 330 }),
      drawtext(sub, { font: fontReg, size: 40, color: "0x334155", x: PANEL_X, y: 470, spacing: 14 }) + "[vtext]",
    ].join(","),
    `[vtext][1:v]overlay=${PHONE_X - 8}:${PHONE_Y - 8},format=yuv420p,trim=0:${duration},setpts=PTS-STARTPTS[v]`,
    `[2:a]aresample=48000,apad,atrim=0:${duration},asetpts=PTS-STARTPTS[a]`,
  ].join(";");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", clip,
      "-i", bezel,
      "-i", join(AUDIO, audio),
      "-filter_complex", fc,
      "-map", "[v]",
      "-map", "[a]",
      "-t", String(duration),
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "48000",
      "-r", "30",
      "-movflags", "+faststart",
      out,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

// Scene 5: supplied outro clip (10s), padded with the OG share image to reach
// the target length. Outro audio dropped — scene5 voice-over is the only track.
const OUTRO_SRC = join(TMP, "outro-src.mp4");
const OG_SRC = join(TMP, "og-src.jpg");
const OUTRO_DL = "D:/Users/Admin/Downloads/Motion_graphics_corporate_outro_…_996dc267.mp4";
const OG_DL = "D:/Users/Admin/Downloads/Open_Graph_social_share_image_0781570f_2K.jpg";

function composeOutro({ outroDur, audio, duration, out }) {
  // The clip's first ~0.9s is AI image-to-video text warp — cut past it and
  // fade in so the title lands already formed.
  const oEff = Math.max(outroDur - 0.9, 1);
  const t1 = Math.min(oEff, duration);
  const t2 = duration - t1;
  const fit = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0B5CAB,setsar=1,fps=30,format=yuv420p`;
  const fc = [
    `[0:v]${fit},trim=start=0.9,setpts=PTS-STARTPTS,trim=0:${t1.toFixed(3)},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.2[v0]`,
    `[1:v]${fit},trim=0:${Math.max(t2, 0).toFixed(3)},setpts=PTS-STARTPTS[v1]`,
    t2 > 0.05
      ? `[v0][v1]concat=n=2:v=1:a=0,trim=0:${duration},setpts=PTS-STARTPTS[v]`
      : `[v0]null[v]`,
    `[2:a]aresample=48000,apad,atrim=0:${duration},asetpts=PTS-STARTPTS[a]`,
  ].join(";");
  execFileSync(
    "ffmpeg",
    [
      "-y",
      "-i", OUTRO_SRC,
      "-loop", "1", "-framerate", "30", "-i", OG_SRC,
      "-i", join(AUDIO, audio),
      "-filter_complex", fc,
      "-map", "[v]",
      "-map", "[a]",
      "-t", String(duration),
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "20",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "48000",
      "-r", "30",
      "-movflags", "+faststart",
      out,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
}

async function main() {
  mkdirSync(TMP, { recursive: true });
  mkdirSync(TXT, { recursive: true });
  mkdirSync(join(ROOT, "public"), { recursive: true });
  const bezel = join(TMP, "bezel.png");
  await makeBezel(bezel); // regenerate — geometry may change between runs

  const parts = [];
  for (const scene of SCENES) {
    const clip = join(CLIPS, `${scene.id}.mp4`);
    const audio = `${scene.id}.mp3`;
    const v = Number(ffprobe(clip));
    const a = Number(ffprobe(join(AUDIO, audio)));
    const duration = Math.max(v, a);
    const titleFile = join(TXT, `${scene.id}-title.txt`);
    const subFile = join(TXT, `${scene.id}-sub.txt`);
    writeFileSync(titleFile, scene.title);
    writeFileSync(subFile, wrap(scene.text, 52));
    const out = join(TMP, `${scene.id}.mp4`);
    console.log(`${scene.id}: video ${v.toFixed(2)}s audio ${a.toFixed(2)}s -> ${duration.toFixed(2)}s`);
    composeScene({ clip, audio, titleFile, subFile, bezel, duration, out });
    parts.push(out);
  }

  // scene5: supplied outro clip, OG image padded to reach the target length
  if (!existsSync(OUTRO_SRC)) copyFileSync(OUTRO_DL, OUTRO_SRC);
  if (!existsSync(OG_SRC)) copyFileSync(OG_DL, OG_SRC);
  const a5 = Number(ffprobe(join(AUDIO, "scene5.mp3")));
  const oDur = Number(ffprobe(OUTRO_SRC));
  const d5 = Math.max(12, Math.min(Math.max(oDur - 0.9, 1), 15), a5);
  console.log(
    `scene5: outro ${oDur.toFixed(2)}s audio ${a5.toFixed(2)}s -> ${d5.toFixed(2)}s`,
  );
  const out5 = join(TMP, "scene5.mp4");
  composeOutro({ outroDur: oDur, audio: "scene5.mp3", duration: d5, out: out5 });
  parts.push(out5);

  const list = join(TMP, "concat.txt");
  writeFileSync(list, parts.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));
  execFileSync(
    "ffmpeg",
    ["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", OUT],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

  const total = Number(ffprobe(OUT));
  console.log(`\n${OUT}`);
  console.log(`duration ${total.toFixed(2)}s (target 85-95)`);
  if (total < 85 || total > 95) console.error("WARN: out of 85-95s window");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
