import { categoryFromSlug, isLocale } from "@kmedia/core";
import { NextResponse } from "next/server";

import { listByCategory, listLatest, toFeedItems } from "@/lib/articles";
import { PAGE_SIZE, pageSkip, parsePage } from "@/lib/feed";

// CDN 에 두는 시간. 새 글은 2시간마다 나오고, 쪽이 밀려 겹치는 글은 FeedLoader 가 slug 로 거른다.
// 짧게 두면 띄엄띄엄 오는 방문마다 뒤에서 다시 만들며 DB 를 깨운다 (5분일 때)
const CDN_CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

// 피드 다음 쪽 (FeedLoader 가 스크롤 끝에서 부른다). /news/page/n · /c/{cat}/page/n 과 같은 20개
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const locale = query.get("locale") ?? "";
  const page = parsePage(query.get("page"));
  const slug = query.get("cat");
  const category = slug ? categoryFromSlug(slug) : undefined;
  if (!isLocale(locale) || !page || page < 2 || (slug && !category)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: { "cache-control": "no-store" } });
  }

  const rows = category
    ? await listByCategory(locale, category, PAGE_SIZE, pageSkip(page))
    : await listLatest(locale, PAGE_SIZE, pageSkip(page));
  return NextResponse.json(await toFeedItems(rows, locale), { headers: { "cache-control": CDN_CACHE } });
}
