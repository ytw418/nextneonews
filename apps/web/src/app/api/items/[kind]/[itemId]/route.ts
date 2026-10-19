import { NextResponse } from "next/server";

import { isKnownItem } from "@/data/catalog";
import { emptyTotals, isItemId, isVoteKind, readItemTotals, TOTALS_CACHE_CONTROL } from "@/lib/item-votes";

const NO_STORE = { "cache-control": "no-store" };

// 항목 하나의 평가 집계. 테이블이 없거나 DB 가 멈춰도 0 집계로 200 — 그 응답은 캐시하지 않는다 (DB 가 돌아오면 바로 실제 숫자)
export async function GET(_request: Request, { params }: RouteContext<"/api/items/[kind]/[itemId]">) {
  const { kind, itemId } = await params;
  if (!isVoteKind(kind) || !isItemId(itemId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  // 모양은 맞아도 카탈로그에 없는 항목 (지운 제품·오타)
  if (!isKnownItem(kind, itemId)) {
    return NextResponse.json({ error: "notFound" }, { status: 404, headers: NO_STORE });
  }
  const { totals, live } = await readItemTotals(kind, [itemId]);
  return NextResponse.json(totals.get(itemId) ?? emptyTotals(kind), {
    headers: live ? { "cache-control": TOTALS_CACHE_CONTROL } : NO_STORE,
  });
}
