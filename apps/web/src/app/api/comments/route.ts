import { NextResponse } from "next/server";

import { clientIp, CreateInput, createComment, ERROR_STATUS, listComments } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 기사 페이지는 5분 캐시라 댓글은 브라우저에서 따로 불러온다
export async function GET(request: Request) {
  const articleId = new URL(request.url).searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  return NextResponse.json({ comments: await listComments(articleId) }, { headers: NO_STORE });
}

export async function POST(request: Request) {
  const parsed = CreateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await createComment(parsed.data, clientIp(request.headers));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return NextResponse.json({ comment: result.comment }, { status: 201, headers: NO_STORE });
}
