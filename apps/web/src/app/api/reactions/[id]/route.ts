import { NextResponse } from "next/server";
import { z } from "zod";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { addReaction, isReactionType } from "@/lib/engagement";

const NO_STORE = { "cache-control": "no-store" };
const Input = z.object({ type: z.string().refine(isReactionType) });

// 글 반응 버튼 (love·wow·more·sad). 이미 누른 종류는 세지 않고 지금 숫자만 돌려준다
export async function POST(request: Request, { params }: RouteContext<"/api/reactions/[id]">) {
  const blocked = rejectWrite(request, { json: true });
  if (blocked) return blocked;
  const { id } = await params;
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!isRecordId(id) || !parsed.success || !isReactionType(parsed.data.type)) {
    return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  }
  const { status, ...body } = await addReaction(id, parsed.data.type, request.headers);
  return NextResponse.json(body, { status, headers: NO_STORE });
}
