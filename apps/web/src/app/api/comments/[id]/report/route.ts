import { NextResponse } from "next/server";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { clientIp, reportComment } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 서로 다른 3명이 신고하면 자동으로 숨긴다 (lib/comments.ts). 본문 없이 보내서 출처만 본다 —
// 막지 않으면 다른 사이트가 JS 없는 폼으로도 방문자 셋을 시켜 댓글을 숨길 수 있다
export async function POST(request: Request, { params }: RouteContext<"/api/comments/[id]/report">) {
  const blocked = rejectWrite(request, { json: false });
  if (blocked) return blocked;
  const { id } = await params;
  const ok = isRecordId(id) && (await reportComment(id, clientIp(request.headers)));
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: NO_STORE });
}
