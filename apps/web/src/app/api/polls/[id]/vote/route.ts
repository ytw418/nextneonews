import { NextResponse } from "next/server";

import { castVote, VoteInput } from "@/lib/engagement";

const NO_STORE = { "cache-control": "no-store" };

// 로그인 없는 투표 한 표. 같은 기기가 다시 내면 409 와 지금 결과를 돌려준다
export async function POST(request: Request, { params }: RouteContext<"/api/polls/[id]/vote">) {
  const { id } = await params;
  const parsed = VoteInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const { status, ...body } = await castVote(id, parsed.data, request.headers);
  return NextResponse.json(body, { status, headers: NO_STORE });
}
