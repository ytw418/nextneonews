#!/usr/bin/env node
// 캡처 6장을 3×2 대조표 한 장(1179×1704, 1배)으로 묶는다. 보기용. 실행: node docs/design/refs-v3/sheet.mjs
import { existsSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const dir = dirname(fileURLToPath(import.meta.url));
const SHEETS = {
  "sheet-01-kagit": ["kagit-home-1", "kagit-home-2", "kagit-home-3", "kagit-home-4", "kagit-ranking-1", "kagit-ranking-2"],
  "sheet-02-kagit-oy": ["kagit-ranking-3", "kagit-article-1", "kagit-article-2", "kagit-article-3", "oliveyoung-global-home-1", "oliveyoung-global-best-1"],
  "sheet-03-oy-lemon8": ["oliveyoung-global-best-2", "oliveyoung-global-best-3", "lemon8-beauty-jp-1", "lemon8-beauty-jp-2", "lemon8-beauty-jp-3", "lemon8-home-1"],
  "sheet-04-xhs-creatrip-klook": ["xiaohongshu-explore-1", "creatrip-home-1", "creatrip-home-2", "creatrip-home-3", "klook-seoul-1", "klook-seoul-2"],
  "sheet-05-weverse-zigzag": ["klook-seoul-3", "weverse-home-1", "weverse-home-2", "zigzag-home-1", "zigzag-home-2", "zigzag-home-3"],
  "sheet-06-29cm-hwahae": ["29cm-home-1", "29cm-home-2", "29cm-home-3", "hwahae-home-1", "hwahae-home-2", "hwahae-rankings-1"],
  "sheet-07-hwahae-glowpick": ["hwahae-rankings-2", "hwahae-rankings-3", "glowpick-home-1", "glowpick-home-2", "glowpick-home-3", "mydramalist-home-1"],
  "sheet-08-mdl-musinsa": ["mydramalist-home-2", "mydramalist-home-3", "musinsa-ranking-1", "musinsa-ranking-2", "musinsa-ranking-3"],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1179, height: 1704 }, deviceScaleFactor: 1 });
for (const [name, files] of Object.entries(SHEETS)) {
  const cells = files
    .filter((f) => existsSync(join(dir, `${f}.jpg`)))
    .map(
      (f) =>
        `<figure><img src="file://${join(dir, `${f}.jpg`)}"><figcaption>${f}</figcaption></figure>`,
    )
    .join("");
  const html = join(dir, `_${name}.html`);
  writeFileSync(
    html,
    `<style>body{margin:0;background:#333;display:grid;grid-template-columns:repeat(3,393px);grid-auto-rows:852px}figure{margin:0;position:relative}img{width:393px;height:852px;object-fit:cover;object-position:top;display:block}figcaption{position:absolute;left:0;top:0;background:#000c;color:#fff;font:600 14px/1.6 sans-serif;padding:0 8px}</style>${cells}`,
  );
  await page.goto(`file://${html}`);
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(dir, `${name}.jpg`) });
  unlinkSync(html);
  console.log(name, files.length);
}
await browser.close();
