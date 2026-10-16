import { NextResponse } from "next/server";

import { isLocale } from "@kmedia/core";

import { getArticle } from "@/lib/articles";
import { nextCandidates } from "@/lib/engagement";

// 이 글 다음에 읽을 글 slug 목록 (최대 6개, 순서대로). 글 페이지와 같은 5분 주기로 CDN 에 둔다
export async function GET(_request: Request, { params }: RouteContext<"/api/next/[locale]/[slug]">) {
  const { locale, slug } = await params;
  const translation = isLocale(locale) ? await getArticle(locale, slug) : null;
  if (!translation) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const rows = await nextCandidates(locale, translation);
  return NextResponse.json(
    { candidates: rows.map((r) => r.slug) },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
