import { LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

import { log } from "../log";

// 사이트(Vercel) 캐시를 비우고 다시 채우는 도우미. 웹 화면은 시간이 지나도 다시 만들지 않으므로(revalidate = false)
// 여기서 비운 주소만 새로 그린다. 비운 직후 그 주소를 한 번씩 요청해서, 다시 그리며 DB 를 읽는 일이
// 파이프라인이 DB 를 깨워 둔 시간 안에 끝나게 한다 (봇이 아무 때나 DB 를 깨우지 않게 — 2026-10-19 Neon 한도 초과)

// /api/revalidate 한 번에 받는 경로 수 (apps/web/src/app/api/revalidate/route.ts MAX_PATHS)
const MAX_PATHS = 50;

// 요청을 넘어 공유하는 데이터 캐시 태그 (apps/web/src/lib/rankings.ts RANKINGS_TAG). 카테고리 태그(articles.ts)는 자동으로 비우지 않는다
export const CACHE_TAG = { rankings: "rankings" } as const;
export type CacheTag = (typeof CACHE_TAG)[keyof typeof CACHE_TAG];

// 미리 요청: 동시에 몇 개, 한 주소를 얼마나 기다리나 (글 화면을 새로 그리는 데 보통 1초 안팎)
const WARM_CONCURRENCY = 6;
const WARM_TIMEOUT_MS = 60_000;
const REVALIDATE_TIMEOUT_MS = 15_000;
// 서버 로그에서 미리 요청을 알아보게
const WARM_UA = "UnnieNoteWarm/1.0 (+https://unnienote.app/en/about#bot)";

export interface SiteRefresh {
  paths: string[]; // 브라우저 주소 (언어 접두사는 소문자 /zh-tw/…)
  pages?: string[]; // 동적 경로 모양 — 그 page 파일로 그린 주소를 모두 비운다 ('/[locale]/news/page/[n]')
  tags?: CacheTag[];
}

function siteUrl(): string | null {
  return process.env.SITE_URL?.replace(/\/$/, "") || null;
}

// 브라우저 주소 → 실제로 그리는 경로. 미들웨어가 /zh-tw → /zh-TW 로 바꿔 그리므로 revalidatePath 는 로케일 코드로 받는다.
// 점이 든 경로(feed.xml·sitemap.xml·llms.txt)는 미들웨어를 거치지 않아 주소 그대로다 (apps/web/src/proxy.ts matcher)
export function renderPath(path: string): string {
  if (path.includes(".")) return path;
  for (const locale of LOCALES) {
    const prefix = LOCALE_PATH_PREFIX[locale];
    if (path === prefix || path.startsWith(`${prefix}/`)) return `/${locale}${path.slice(prefix.length)}`;
  }
  return path;
}

// 하루 1번 다시 그릴 사이트맵 주소 (언어 접두사를 뗀 경로). 사이트맵에는 검색에 내는 주소만 있다:
// 인물은 최근 30일 차트 상위 30, 가이드 섹션은 색인 언어(en·ja·zh-TW)의 허브·어워드·상세.
// 다른 섹션도 매일 새로 그려야 하면 여기에 한 줄 더한다 (refresh.ts day)
export const DAILY_SITEMAP_PATTERNS: RegExp[] = [
  /^\/idol\/[^/]+$/, // 순위·90일 선·국내 화제가 매일 바뀐다
  /^\/(guide|beauty|travel|clinic|drama)(\/.*)?$/, // 투표 집계·드라마 화제
];

// 배포 직후 미리 그릴 사이트맵 주소 (refresh.ts deploy): 빌드 때 만들지 않는 화면(글·인물·주간 고정 차트)만.
// 홈·카테고리·랭킹·가이드는 빌드 때 이미 그려져 있다
export const DEPLOY_SITEMAP_PATTERNS: RegExp[] = [
  /^\/news\/[^/]+$/,
  /^\/idol\/[^/]+$/,
  /^\/rankings\/[^/]+\/[^/]+$/,
];

// 사이트맵 XML 에서 주소(<loc>)를 꺼내, 언어 접두사를 뗀 경로가 patterns 중 하나에 맞는 것만 브라우저 경로로 돌려준다.
// hreflang 대체 주소(<xhtml:link>)는 같은 사이트맵의 다른 <loc> 로도 들어 있어서 따로 읽지 않는다
export function pickSitemapPaths(xml: string, patterns: RegExp[]): string[] {
  const picked = new Set<string>();
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    let path: string;
    try {
      path = decodeURI(new URL(loc!.replaceAll("&amp;", "&")).pathname);
    } catch {
      continue;
    }
    const prefix = Object.values(LOCALE_PATH_PREFIX).find((p) => path === p || path.startsWith(`${p}/`));
    if (!prefix) continue;
    const rest = path.slice(prefix.length);
    if (patterns.some((pattern) => pattern.test(rest))) picked.add(path);
  }
  return [...picked];
}

async function postRevalidate(body: { paths: string[]; pages?: string[]; tags?: CacheTag[] }): Promise<boolean> {
  const url = siteUrl();
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) {
    log.info("revalidate: skipped (SITE_URL or REVALIDATE_SECRET not set)");
    return false;
  }
  try {
    const res = await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
    });
    if (res.ok) return true;
    log.warn("revalidate: rejected", { status: res.status, body: (await res.text()).slice(0, 200) });
  } catch (error) {
    log.warn("revalidate: failed", { error: String(error) });
  }
  return false;
}

// 사이트 캐시를 비운다. 실패해도 경고만 남긴다 — 글 작성·번역은 계속 돌아야 하고, 화면은 다음 비우기 때 새로 그린다
export async function revalidateSite({ paths, pages = [], tags = [] }: SiteRefresh): Promise<void> {
  const rendered = [...new Set(paths.map(renderPath))];
  const chunks: string[][] = [];
  for (let i = 0; i < rendered.length; i += MAX_PATHS) chunks.push(rendered.slice(i, i + MAX_PATHS));
  if (chunks.length === 0) chunks.push([]);
  let sent = 0;
  for (const [i, chunk] of chunks.entries()) {
    // 경로 모양·태그는 첫 묶음에만 싣는다
    const body = i === 0 ? { paths: chunk, pages, tags } : { paths: chunk };
    if (body.paths.length + (body.pages?.length ?? 0) + (body.tags?.length ?? 0) === 0) continue;
    if (await postRevalidate(body)) sent += chunk.length;
  }
  log.info("revalidate: done", { paths: sent, of: rendered.length, pages: pages.length, tags });
}

// 비운 주소를 한 번씩 요청해 지금(DB 가 깨어 있을 때) 새로 그리게 한다. 상태 코드별 개수만 남긴다
export async function warm(paths: string[]): Promise<void> {
  const url = siteUrl();
  const queue = [...new Set(paths)];
  if (!url || queue.length === 0) return;
  const total = queue.length;
  const statuses: Record<string, number> = {};
  const started = Date.now();
  const worker = async () => {
    for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
      let key: string;
      try {
        const res = await fetch(`${url}${path}`, {
          headers: { "user-agent": WARM_UA },
          redirect: "manual",
          signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
        });
        await res.arrayBuffer(); // 본문까지 받아야 그리기가 끝난다
        key = String(res.status);
      } catch {
        key = "failed";
      }
      statuses[key] = (statuses[key] ?? 0) + 1;
    }
  };
  await Promise.all(Array.from({ length: Math.min(WARM_CONCURRENCY, total) }, worker));
  log.info("warm: done", { paths: total, statuses, seconds: Math.round((Date.now() - started) / 1000) });
}

// 사이트의 글자 응답 하나 (사이트맵). 못 받으면 null
export async function fetchSiteText(path: string): Promise<string | null> {
  const url = siteUrl();
  if (!url) return null;
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { "user-agent": WARM_UA },
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
    });
    if (res.ok) return await res.text();
    log.warn("site: fetch rejected", { path, status: res.status });
  } catch (error) {
    log.warn("site: fetch failed", { path, error: String(error) });
  }
  return null;
}
