/** Tiny assert-based checks for JSON parse + guardrail. Run: npx tsx scripts/check-intent.ts */
import { parseJsonObject } from "../src/lib/intent";
import { GUARDRAIL_SENTENCE, ROUTE_AND_SCAM_PROMPT } from "../src/lib/prompts";

let failed = 0;

try {
  const j = parseJsonObject('noise {"intent":"scam","level":"danger","reasons":["a"],"advice":"b"} trailing');
  if (j.intent !== "scam" || j.level !== "danger") throw new Error("bad parse");
} catch (e) {
  failed += 1;
  console.error("FAIL parseJsonObject", e);
}

try {
  const j = parseJsonObject('{"intent":"rag","level":"safe","reasons":[],"advice":""}');
  if (j.intent !== "rag") throw new Error("bad rag");
} catch (e) {
  failed += 1;
  console.error("FAIL rag parse", e);
}

if (!GUARDRAIL_SENTENCE.startsWith("Thông tin này chưa có")) {
  failed += 1;
  console.error("FAIL guardrail sentence");
}

if (!ROUTE_AND_SCAM_PROMPT.includes('"intent"')) {
  failed += 1;
  console.error("FAIL route prompt");
}

if (failed === 0) {
  console.log("ok: json parse + guardrail + route prompt");
} else {
  process.exit(1);
}
