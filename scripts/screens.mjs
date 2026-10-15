// 아이폰 화면 캡처: 주요 화면을 한 번에 찍어 디자인을 확인한다.
// 사용: node scripts/screens.mjs [기준 URL] [저장 폴더]
//   node scripts/screens.mjs http://localhost:3000 /tmp/hb-shots
// 저장 폴더는 레포 밖에 둔다 (dev 서버가 레포 안 파일 변경을 보고 새로고침한다)
import { chromium, devices } from "playwright";

const base = process.argv[2] ?? "http://localhost:3000";
const out = process.argv[3] ?? "/tmp/hb-shots";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 15"], locale: "en-US" });
const page = await ctx.newPage();

// 첫 기사 주소는 사이트맵에서 찾는다
const sitemap = await (await fetch(`${base}/sitemap.xml`)).text();
const article = sitemap.match(/<loc>[^<]*?(\/en\/news\/[^<]+)<\/loc>/)?.[1] ?? "/en";

const shots = [
  ["01-home.png", "/en", 0],
  ["02-home-feed.png", "/en", 700],
  ["03-category.png", "/en/c/kpop", 0],
  ["04-article.png", article, 0],
  ["05-article-body.png", article, 900],
  ["06-article-end.png", article, -1],
  ["07-home-ja.png", "/ja", 0],
  ["08-home-ru.png", "/ru", 0],
  ["09-home-vi.png", "/vi", 0],
];
for (const [file, path, y] of shots) {
  await page.goto(base + path, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  if (y === -1) await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  else if (y) await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${out}/${file}` });
}
await browser.close();
console.log(`saved ${shots.length} screenshots to ${out}`);
