import { categoryFromSlug, isLocale } from "@kmedia/core";
import { NextResponse } from "next/server";

import { listByCategory, listLatest, toFeedItems } from "@/lib/articles";
import { PAGE_SIZE, pageSkip, parsePage } from "@/lib/feed";

// 피드 다음 쪽 (FeedLoader 가 스크롤 끝에서 부른다). /news/page/n · /c/{cat}/page/n 과 같은 20개.
// 화면처럼 5분 동안 CDN 에 둔다
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
  return NextResponse.json(await toFeedItems(rows, locale), {
    headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
