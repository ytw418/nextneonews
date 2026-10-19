import { isLocale } from "@kmedia/core";
import { NextResponse } from "next/server";

import { type ItemRef, parseItemRef, summarizeMany } from "@/data/catalog";

const NO_STORE = { "cache-control": "no-store" };
const MAX_ITEMS = 100;

// 저장함(/saved)이 부른다: ?items=kind:id,kind:id (100개까지) &locale= → { items: CatalogSummary[] } (그 언어 제목·주소·틴트).
// 받은 순서 그대로, 없어진 항목(카탈로그에서 빠졌거나 글이 내려감)과 모양이 틀린 항목은 빼고 돌려준다
// (잘린 공유 링크 한 칸 때문에 나머지까지 못 불러오지 않게). 400 은 언어가 틀렸거나 너무 많을 때만. 같은 목록이면 5분 동안 CDN 에 둔다.
// DB 가 멈춰 글 줄을 못 채웠으면 카탈로그 줄만 주고 캐시하지 않는다 (DB 가 돌아오면 다음 방문에 바로 글 줄이 보이게)
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const locale = query.get("locale") ?? "";
  const raw = (query.get("items") ?? "").split(",").filter(Boolean);
  if (!isLocale(locale) || raw.length > MAX_ITEMS) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  const refs = raw.map(parseItemRef).filter((r): r is ItemRef => r !== null);

  // 같은 항목이 두 번 오면 한 번만
  const unique = [...new Map(refs.map((r) => [`${r.kind}:${r.id}`, r])).values()];
  const { items, partial } = await summarizeMany(unique, locale);
  return NextResponse.json(
    { items },
    { headers: partial ? NO_STORE : { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
