import { NextResponse } from "next/server";

import { isKnownItem } from "@/data/catalog";
import { emptyTotals, getItemTotals, isItemId, isVoteKind } from "@/lib/item-votes";

const NO_STORE = { "cache-control": "no-store" };
// 숫자는 5분 묵어도 된다 (투표한 사람은 투표 응답으로 바로 새 숫자를 받는다)
const SHARED_CACHE = { "cache-control": "public, s-maxage=300, stale-while-revalidate=600" };

// 항목 하나의 평가 집계. 테이블이 없거나 DB 가 멈춰도 0 집계로 200
export async function GET(_request: Request, { params }: RouteContext<"/api/items/[kind]/[itemId]">) {
  const { kind, itemId } = await params;
  if (!isVoteKind(kind) || !isItemId(itemId)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  // 모양은 맞아도 카탈로그에 없는 항목 (지운 제품·오타)
  if (!isKnownItem(kind, itemId)) {
    return NextResponse.json({ error: "notFound" }, { status: 404, headers: NO_STORE });
  }
  const totals = (await getItemTotals(kind, [itemId])).get(itemId) ?? emptyTotals(kind);
  return NextResponse.json(totals, { headers: SHARED_CACHE });
}
