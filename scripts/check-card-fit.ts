import { fitScale, topHeight, wrapLines, FIT } from "../src/lib/card-fit";
import { readFile } from "node:fs/promises";
import path from "node:path";
import opentype from "opentype.js";

async function main() {
  let failed = 0;
  const ok = (cond: boolean, msg: string) => {
    if (!cond) {
      console.error(`FAIL: ${msg}`);
      failed += 1;
    }
  };

  const buf = await readFile(path.join(process.cwd(), "fonts", "BeVietnamPro-Regular.ttf"));
  const font = opentype.parse(
    buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
  );

  ok(wrapLines(font, "một dòng ngắn", 26, 776) === 1, "short text is one line");
  ok(wrapLines(font, "word ".repeat(400), 26, 776) > 3, "long text wraps");
  ok(
    wrapLines(font, "word ".repeat(400), 26, 776) <
      wrapLines(font, "word ".repeat(400), 44, 776),
    "bigger font wraps to more lines",
  );

  const short = {
    title: "Thu gom rác thải nguy hiểm và thiết bị điện tử cũ tại khu dân cư",
    summary:
      "Thực hiện mô hình phân loại rác tại nguồn thuộc chương trình “Cẩm Lệ xanh”, phường tổ chức tiếp nhận pin đã qua sử dụng, bóng đèn huỳnh quang, ắc-quy và thiết bị điện tử cũ để bàn giao đơn vị chuyển trách xử lý an toàn, không thu phí.",
    timeLine:
      "14:00–17:00 chiều Thứ Năm hàng tuần; tại điểm tập kết phân loại rác nguy hiểm (khu vực sân trụ sở UBND phường Cẩm Lệ – 135 Ông Ích Đường và các điểm thu gom của Hội Liên hiệp Phụ nữ tổ dân phố).",
  };

  const k = await fitScale(short);
  ok(k >= 0.7 && k <= 1.8, `scale in range, got ${k}`);
  const h = await topHeight(k, short);
  ok(h <= FIT + 1, `fitted height ${h.toFixed(0)} <= ${FIT}`);
  if (k < 1.8) {
    const next = await topHeight(Math.round((k + 0.01) * 100) / 100, short);
    ok(next > FIT, "k is maximal (next step overflows)");
  }

  const huge = { title: "x".repeat(300), summary: "y".repeat(2000) };
  const kh = await fitScale(huge);
  ok(kh >= 0.7 && kh <= 1.8, `huge content scale in range, got ${kh}`);

  console.log(failed ? "card-fit: FAILED" : "card-fit: ok");
  if (failed) process.exitCode = 1;
}

void main();
