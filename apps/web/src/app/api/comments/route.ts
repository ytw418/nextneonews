import { NextResponse } from "next/server";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { clientIp, COMMENTS_CACHE_SECONDS, CreateInput, createComment, ERROR_STATUS, listComments } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 기사 페이지는 캐시라 댓글은 브라우저에서 따로 불러온다. 목록은 1분 동안 CDN 에 둔다 — 글을 여는 사람마다 DB 를 깨우지 않게.
// 방금 쓴·고친·지운 사람은 화면(Comments.tsx)이 주소에 시각을 붙여 이 캐시를 건너뛴다
export async function GET(request: Request) {
  const articleId = new URL(request.url).searchParams.get("articleId");
  if (!isRecordId(articleId)) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  return NextResponse.json(await listComments(articleId), {
    headers: { "cache-control": `public, s-maxage=${COMMENTS_CACHE_SECONDS}` },
  });
}

export async function POST(request: Request) {
  const blocked = rejectWrite(request, { json: true });
  if (blocked) return blocked;
  const parsed = CreateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await createComment(parsed.data, clientIp(request.headers));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return NextResponse.json({ comment: result.comment }, { status: 201, headers: NO_STORE });
}
