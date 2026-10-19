#!/usr/bin/env node
// 레퍼런스 캡처 v3 (2026-10-19): 아이폰 15 크기(393×852, 2배)로 첫 화면·스크롤 화면을 찍는다.
// 실행: node docs/design/refs-v3/capture.mjs  (저장소 루트에서. playwright 는 루트 node_modules 의 것을 쓴다)
// 로그인 벽·봇 차단이면 그 사이트는 건너뛰고 결과 표(README 머리)에 남긴다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium, devices } from "playwright";

const outDir = dirname(fileURLToPath(import.meta.url));
mkdirSync(outDir, { recursive: true });

const iphone = devices["iPhone 15"];
const VIEW = { width: 393, height: 852 };

// name: 파일 접두사 · url · locale · pages: 추가로 찍을 하위 화면(링크 글자나 경로)
const SITES = [
  {
    name: "kagit-home",
    url: "https://kagit.kr/",
    locale: "zh-TW",
    scrolls: 3,
    follow: [
      { name: "kagit-ranking", textLike: ["排行榜", "ranking", "랭킹"], hrefLike: ["rank"] },
      { name: "kagit-article", hrefLike: ["/article", "/post", "/news", "/p/"], firstOf: "main a[href]" },
    ],
  },
  { name: "oliveyoung-global-home", url: "https://global.oliveyoung.com/", locale: "en-US", scrolls: 2 },
  {
    name: "oliveyoung-global-best",
    url: "https://global.oliveyoung.com/display/page/best-seller",
    locale: "en-US",
    scrolls: 2,
  },
  { name: "lemon8-beauty-jp", url: "https://www.lemon8-app.com/discover/beauty?region=jp", locale: "ja-JP", scrolls: 2 },
  { name: "lemon8-home", url: "https://www.lemon8-app.com/", locale: "ja-JP", scrolls: 1 },
  { name: "xiaohongshu-explore", url: "https://www.xiaohongshu.com/explore", locale: "zh-CN", scrolls: 1 },
  { name: "creatrip-home", url: "https://www.creatrip.com/zh", locale: "zh-TW", scrolls: 2 },
  { name: "klook-seoul", url: "https://www.klook.com/zh-TW/city/13-seoul-things-to-do/", locale: "zh-TW", scrolls: 2 },
  { name: "weverse-home", url: "https://weverse.io/", locale: "en-US", scrolls: 1 },
  { name: "zigzag-home", url: "https://zigzag.kr/", locale: "ko-KR", scrolls: 2 },
  { name: "29cm-home", url: "https://www.29cm.co.kr/", locale: "ko-KR", scrolls: 2 },
  { name: "hwahae-home", url: "https://www.hwahae.co.kr/", locale: "ko-KR", scrolls: 2 },
  { name: "hwahae-rankings", url: "https://www.hwahae.co.kr/rankings", locale: "ko-KR", scrolls: 2 },
  { name: "glowpick-home", url: "https://www.glowpick.com/", locale: "ko-KR", scrolls: 2 },
  { name: "mydramalist-home", url: "https://mydramalist.com/", locale: "en-US", scrolls: 2 },
  { name: "musinsa-ranking", url: "https://www.musinsa.com/main/musinsa/ranking", locale: "ko-KR", scrolls: 2 },
];

const results = [];
const browser = await chromium.launch();

function log(...a) {
  console.log(new Date().toISOString().slice(11, 19), ...a);
}

// 화면을 덮는 모달·전면 광고만 지운다 (상단바·하단 탭바처럼 낮은 띠는 둔다)
async function clearOverlays(page) {
  await page.keyboard.press("Escape").catch(() => {});
  for (const sel of [
    'button[aria-label*="close" i]',
    'button[aria-label*="關閉"]',
    'button[aria-label*="閉じる"]',
    'button[aria-label*="닫기"]',
    '[class*="close" i][role="button"]',
    'button:has-text("Accept")',
    'button:has-text("同意")',
    'button:has-text("확인")',
    'button:has-text("오늘 하루")',
  ]) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 300 }).catch(() => false)) {
      await el.click({ timeout: 1000 }).catch(() => {});
    }
  }
  await page.evaluate(() => {
    const vw = innerWidth;
    const vh = innerHeight;
    for (const el of Array.from(document.body.querySelectorAll("*"))) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") continue;
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      const covers = area > vw * vh * 0.55 && r.height > 240;
      if (covers) el.remove();
    }
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  });
}

async function blocked(page) {
  const title = (await page.title().catch(() => "")) || "";
  const text = (await page.locator("body").innerText({ timeout: 2000 }).catch(() => "")) || "";
  const t = `${title}\n${text.slice(0, 2000)}`.toLowerCase();
  return /just a moment|cloudflare|access denied|verify you are human|captcha|滑动验证|请完成验证|403 forbidden|attention required/.test(
    t,
  );
}

async function shoot(page, name, scrolls) {
  const files = [];
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  const first = join(outDir, `${name}-1.png`);
  await page.screenshot({ path: first });
  files.push(first);
  for (let i = 1; i <= scrolls; i += 1) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), VIEW.height * i);
    await page.waitForTimeout(900);
    const f = join(outDir, `${name}-${i + 1}.png`);
    await page.screenshot({ path: f });
    files.push(f);
  }
  await page.evaluate(() => scrollTo(0, 0));
  return files;
}

async function visit(site) {
  const context = await browser.newContext({
    ...iphone,
    viewport: VIEW,
    deviceScaleFactor: 2,
    locale: site.locale,
    timezoneId: site.locale.startsWith("ja") ? "Asia/Tokyo" : site.locale.startsWith("ko") ? "Asia/Seoul" : "Asia/Taipei",
    colorScheme: "light",
  });
  const page = await context.newPage();
  const row = { name: site.name, url: site.url, status: "ok", files: [] };
  try {
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);
    await clearOverlays(page);
    await page.waitForTimeout(500);
    if (await blocked(page)) {
      row.status = "blocked";
      await page.screenshot({ path: join(outDir, `${site.name}-blocked.png`) });
    } else {
      row.files = await shoot(page, site.name, site.scrolls ?? 1);
      row.title = await page.title().catch(() => "");
      for (const f of site.follow ?? []) {
        try {
          const href = await page.evaluate(
            ({ textLike, hrefLike, firstOf }) => {
              const anchors = Array.from(document.querySelectorAll("a[href]"));
              const byText = anchors.find((a) => (textLike ?? []).some((t) => a.textContent?.trim().toLowerCase().includes(t.toLowerCase())));
              if (byText) return byText.href;
              const byHref = anchors.find((a) => (hrefLike ?? []).some((h) => a.getAttribute("href")?.includes(h)));
              if (byHref) return byHref.href;
              if (firstOf) {
                const el = document.querySelector(firstOf);
                return el ? el.href : null;
              }
              return null;
            },
            f,
          );
          if (!href) {
            results.push({ name: f.name, url: "(링크 못 찾음)", status: "skip", files: [] });
            continue;
          }
          await page.goto(href, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(2500);
          await clearOverlays(page);
          const files = await shoot(page, f.name, 2);
          results.push({ name: f.name, url: href, status: "ok", files, title: await page.title().catch(() => "") });
        } catch (e) {
          results.push({ name: f.name, url: "", status: `error: ${String(e.message).slice(0, 80)}`, files: [] });
        }
      }
    }
  } catch (e) {
    row.status = `error: ${String(e.message).slice(0, 100)}`;
  }
  results.push(row);
  await context.close();
  log(row.name, row.status, row.files.length);
}

for (const site of SITES) {
  await visit(site);
}
await browser.close();

const lines = ["| 이름 | 주소 | 상태 | 파일 수 | 제목 |", "|---|---|---|---|---|"];
for (const r of results) lines.push(`| ${r.name} | ${r.url} | ${r.status} | ${r.files.length} | ${(r.title ?? "").replaceAll("|", "/").slice(0, 60)} |`);
writeFileSync(join(outDir, "capture-log.md"), `# 캡처 결과 (${new Date().toISOString().slice(0, 10)})\n\n${lines.join("\n")}\n`);
console.log(lines.join("\n"));
