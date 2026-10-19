import { NextResponse } from "next/server";

import { isKnownItem } from "@/data/catalog";
import { isItemId, isVoteKind, readItemTotals, TOTALS_CACHE_CONTROL } from "@/lib/item-votes";
import { ITEMS_BATCH_MAX } from "@/lib/vote-rules";

const NO_STORE = { "cache-control": "no-store" };

// 여러 항목의 평가 집계를 한 번에 (가이드 목록·어워드·드라마 카드): ?ids=a,b,c (ITEMS_BATCH_MAX 개까지) → { items: { id: ItemTotals } }.
// 모양이 틀리거나 카탈로그에 없는 id 는 빼고 돌려준다. 화면은 id 를 정렬해 보내서 같은 목록을 보는 독자끼리 CDN 캐시(5분)를 나눈다.
// DB 가 멈췄으면 0 집계를 주되 캐시하지 않는다
export async function GET(request: Request, { params }: RouteContext<"/api/items/[kind]">) {
  const { kind } = await params;
  const raw = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter(Boolean);
  if (!isVoteKind(kind) || raw.length === 0 || raw.length > ITEMS_BATCH_MAX) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  const ids = [...new Set(raw)].filter((id) => isItemId(id) && isKnownItem(kind, id));
  const { totals, live } = await readItemTotals(kind, ids);
  return NextResponse.json(
    { items: Object.fromEntries(totals) },
    { headers: live ? { "cache-control": TOTALS_CACHE_CONTROL } : NO_STORE },
  );
}
