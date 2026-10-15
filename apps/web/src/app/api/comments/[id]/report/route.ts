import { NextResponse } from "next/server";

import { reportComment } from "@/lib/comments";

// 신고 3번이면 자동으로 숨긴다 (lib/comments.ts)
export async function POST(_request: Request, { params }: RouteContext<"/api/comments/[id]/report">) {
  const { id } = await params;
  const ok = await reportComment(id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404, headers: { "cache-control": "no-store" } });
}
