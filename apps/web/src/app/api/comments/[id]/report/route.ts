import { NextResponse } from "next/server";

import { clientIp, reportComment } from "@/lib/comments";

// 서로 다른 3명이 신고하면 자동으로 숨긴다 (lib/comments.ts)
export async function POST(request: Request, { params }: RouteContext<"/api/comments/[id]/report">) {
  const { id } = await params;
  const ok = await reportComment(id, clientIp(request.headers));
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: { "cache-control": "no-store" } });
}
