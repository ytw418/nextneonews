import { NextResponse } from "next/server";

import { isLocale } from "@kmedia/core";

import { appendedArticle } from "@/lib/engagement";

// CDN 에 하루 둔다. 반응·투표 숫자는 글 페이지처럼 하루까지 묵을 수 있다 (누르면 응답의 새 숫자로 바뀐다).
// 5분으로 두면 사람이 글 끝까지 읽을 때마다 뒤에서 다시 만들며 DB 를 깨웠다
const CDN_CACHE = "public, s-maxage=86400, stale-while-revalidate=86400";

// 글 끝에 이어 붙이는 다음 글 (NextArticleLoader). 검색에는 원래 글 주소만 나가도록 noindex
export async function GET(_request: Request, { params }: RouteContext<"/api/article/[locale]/[slug]">) {
  const { locale, slug } = await params;
  const data = isLocale(locale) ? await appendedArticle(locale, slug) : null;
  const robots = { "x-robots-tag": "noindex" };
  if (!data) return NextResponse.json({ error: "notFound" }, { status: 404, headers: robots });
  return NextResponse.json(data, { headers: { ...robots, "cache-control": CDN_CACHE } });
}
