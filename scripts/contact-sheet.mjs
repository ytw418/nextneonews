// 아이폰 캡처 여러 장을 한 장으로 묶는다 (진행 보고·비교용).
// 사용: node scripts/contact-sheet.mjs <저장 경로.png> "<제목>" <캡처1> [캡처2 …]
//   캡처 이름 뒤에 =설명 을 붙이면 그 설명을 캡션으로 쓴다: /tmp/a.png=가이드 허브
// 한 줄에 4장, 캡처는 폭 300px 로 줄인다
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";
import { chromium } from "playwright";

const [out, title, ...inputs] = process.argv.slice(2);
if (!out || inputs.length === 0) {
  console.error('사용: node scripts/contact-sheet.mjs <저장 경로.png> "<제목>" <캡처1> [캡처2 …]');
  process.exit(1);
}

const PER_ROW = 4;
const CELL = 300;
const cells = inputs.map((arg) => {
  const [file, caption] = arg.split("=");
  const mime = extname(file).toLowerCase() === ".jpg" ? "image/jpeg" : "image/png";
  const data = readFileSync(file).toString("base64");
  return `<figure><img src="data:${mime};base64,${data}"><figcaption>${caption ?? basename(file)}</figcaption></figure>`;
});

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin: 0; padding: 24px; background: #f4f1ec; font: 15px -apple-system, "Apple SD Gothic Neo", sans-serif; color: #1b1520; }
  h1 { margin: 0 0 16px; font-size: 22px; }
  main { display: grid; grid-template-columns: repeat(${PER_ROW}, ${CELL}px); gap: 20px; align-items: start; }
  figure { margin: 0; }
  img { width: ${CELL}px; display: block; border-radius: 18px; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
  figcaption { margin-top: 8px; font-weight: 600; line-height: 1.35; }
</style><h1>${title ?? ""}</h1><main>${cells.join("")}</main>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: PER_ROW * (CELL + 20) + 28, height: 600 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`saved ${inputs.length} shots to ${out}`);
