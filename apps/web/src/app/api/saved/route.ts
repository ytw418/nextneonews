import { isLocale } from "@kmedia/core";
import { NextResponse } from "next/server";

import { type ItemRef, parseItemRef, summarizeMany } from "@/data/catalog";

const NO_STORE = { "cache-control": "no-store" };
const MAX_ITEMS = 100;

// 저장함(/saved)이 부른다: ?items=kind:id,kind:id (100개까지) &locale= → { items: CatalogSummary[] } (그 언어 제목·주소·틴트).
// 받은 순서 그대로, 없어진 항목(카탈로그에서 빠졌거나 글이 내려감)은 빼고 돌려준다. 같은 목록이면 5분 동안 CDN 에 둔다
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const locale = query.get("locale") ?? "";
  const raw = (query.get("items") ?? "").split(",").filter(Boolean);
  const refs = raw.map(parseItemRef);
  if (!isLocale(locale) || raw.length > MAX_ITEMS || refs.some((r) => r === null)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }

  // 같은 항목이 두 번 오면 한 번만
  const unique = [...new Map((refs as ItemRef[]).map((r) => [`${r.kind}:${r.id}`, r])).values()];
  const items = await summarizeMany(unique, locale);
  return NextResponse.json(
    { items },
    { headers: { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
