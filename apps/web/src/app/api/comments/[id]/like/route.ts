import { NextResponse } from "next/server";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { likeComment } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 댓글 공감 (한 기기 한 번). 이미 누른 댓글이면 세지 않고 지금 수만 돌려준다. 본문 없이 보낸다 (신고와 같은 출처 검사)
export async function POST(request: Request, { params }: RouteContext<"/api/comments/[id]/like">) {
  const blocked = rejectWrite(request, { json: false });
  if (blocked) return blocked;
  const { id } = await params;
  if (!isRecordId(id)) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const { status, likes } = await likeComment(id, request.headers);
  return NextResponse.json({ likes }, { status, headers: NO_STORE });
}
