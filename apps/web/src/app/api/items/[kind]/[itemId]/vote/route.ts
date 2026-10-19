import { NextResponse } from "next/server";

import { isKnownItem } from "@/data/catalog";
import { castItemVote, isItemId, isValidVote, isVoteKind, ItemVoteInput } from "@/lib/item-votes";

const NO_STORE = { "cache-control": "no-store" };

// 항목 평가 한 표 { choice, facet?, locale }. 같은 기기가 답을 바꾸면 덮어쓰고, 같은 답이면 counted:false 로 지금 집계만 준다
export async function POST(request: Request, { params }: RouteContext<"/api/items/[kind]/[itemId]/vote">) {
  const { kind, itemId } = await params;
  const parsed = ItemVoteInput.safeParse(await request.json().catch(() => null));
  if (!isVoteKind(kind) || !isItemId(itemId) || !parsed.success || !isValidVote(kind, parsed.data)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  // 모양은 맞아도 카탈로그에 없는 항목에는 표를 남기지 않는다 (없는 slug 로 테이블이 불어나지 않게)
  if (!isKnownItem(kind, itemId)) {
    return NextResponse.json({ error: "notFound" }, { status: 404, headers: NO_STORE });
  }
  const { status, ...body } = await castItemVote(kind, itemId, parsed.data, request.headers);
  return NextResponse.json(body, { status, headers: NO_STORE });
}
