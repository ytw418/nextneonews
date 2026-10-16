import { articlePath, categorySlug, type CategoryKey, localeHomePath } from "@kmedia/core";

import { log } from "../log";
import { notifyIndexNow } from "./indexnow";

// 새 글·새 언어판을 바로 알린다: 사이트 캐시(사이트맵·홈·피드·카테고리)를 비우고 IndexNow 에 URL 을 보낸다.
// 실패해도 경고만 남긴다 — 캐시는 길어야 1시간 뒤 저절로 갱신되고, 글 작성·번역은 계속 돌아야 한다

export interface AnnouncedPage {
  locale: string;
  slug: string;
  category: CategoryKey;
  indexable: boolean; // noindex 판은 목록만 새로 그리고 검색엔진에는 알리지 않는다
}

const MAX_PATHS = 50; // /api/revalidate 한 번에 받는 경로 수 (apps/web/src/app/api/revalidate/route.ts)

// revalidatePath 는 브라우저 주소가 아니라 실제로 그리는 경로를 받는다. 미들웨어가 /zh-tw → /zh-TW 로 바꿔 그리므로
// 페이지는 로케일 코드로 적는다. feed.xml 은 점이 든 경로라 미들웨어를 거치지 않아 주소 그대로다
function revalidatePaths(pages: AnnouncedPage[]): string[] {
  const paths = new Set(["/sitemap.xml", "/news-sitemap.xml"]);
  for (const { locale, category } of pages) {
    paths.add(`/${locale}`);
    paths.add(`${localeHomePath(locale)}/feed.xml`);
    paths.add(`/${locale}/c/${categorySlug(category)}`);
  }
  return [...paths];
}

async function revalidate(paths: string[]): Promise<void> {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    log.info("revalidate: skipped (SITE_URL or REVALIDATE_SECRET not set)");
    return;
  }
  for (let i = 0; i < paths.length; i += MAX_PATHS) {
    const chunk = paths.slice(i, i + MAX_PATHS);
    try {
      const res = await fetch(`${siteUrl}/api/revalidate`, {
        method: "POST",
        headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
        body: JSON.stringify({ paths: chunk }),
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) log.info("revalidate: done", { paths: chunk.length, status: res.status });
      else log.warn("revalidate: rejected", { status: res.status, body: (await res.text()).slice(0, 200) });
    } catch (error) {
      log.warn("revalidate: failed", { error: String(error) });
    }
  }
}

export async function announce(pages: AnnouncedPage[]): Promise<void> {
  if (pages.length === 0) return;
  const siteUrl = process.env.SITE_URL ?? "";
  await revalidate(revalidatePaths(pages));
  const urls = pages.filter((p) => p.indexable).map((p) => `${siteUrl}${articlePath(p.locale, p.slug)}`);
  await notifyIndexNow(urls);
}
