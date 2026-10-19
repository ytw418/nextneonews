import { NextResponse } from "next/server";

import { isLocale } from "@kmedia/core";

import { getArticle } from "@/lib/articles";
import { nextCandidates } from "@/lib/engagement";

// CDN 에 하루 둔다. 글 페이지도 시간 기반으로는 다시 만들지 않아(revalidate = false) 후보가 그보다 자주 바뀔 일이 없고,
// 짧게 두면 띄엄띄엄 오는 요청마다 뒤에서 다시 만들며 DB 를 깨운다
const CDN_CACHE = "public, s-maxage=86400, stale-while-revalidate=86400";

// 이 글 다음에 읽을 글 slug 목록 (최대 6개, 순서대로)
export async function GET(_request: Request, { params }: RouteContext<"/api/next/[locale]/[slug]">) {
  const { locale, slug } = await params;
  const translation = isLocale(locale) ? await getArticle(locale, slug) : null;
  if (!translation) return NextResponse.json({ error: "notFound" }, { status: 404 });
  const rows = await nextCandidates(locale, translation);
  return NextResponse.json({ candidates: rows.map((r) => r.slug) }, { headers: { "cache-control": CDN_CACHE } });
}
