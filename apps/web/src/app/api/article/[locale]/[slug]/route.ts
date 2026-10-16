import { NextResponse } from "next/server";

import { isLocale } from "@kmedia/core";

import { appendedArticle } from "@/lib/engagement";

// 글 끝에 이어 붙이는 다음 글 (NextArticleLoader). 검색에는 원래 글 주소만 나가도록 noindex
export async function GET(_request: Request, { params }: RouteContext<"/api/article/[locale]/[slug]">) {
  const { locale, slug } = await params;
  const data = isLocale(locale) ? await appendedArticle(locale, slug) : null;
  const robots = { "x-robots-tag": "noindex" };
  if (!data) return NextResponse.json({ error: "notFound" }, { status: 404, headers: robots });
  return NextResponse.json(data, {
    headers: { ...robots, "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" },
  });
}
