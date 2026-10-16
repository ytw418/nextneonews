import { timingSafeEqual } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const NO_STORE = { "cache-control": "no-store" };

// 경로는 실제로 그리는 경로다 (미들웨어가 /zh-tw → /zh-TW 로 바꾸므로 페이지는 로케일 코드로 받는다)
const Body = z.object({ paths: z.array(z.string().startsWith("/").max(1024)).max(50) });

function authorized(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// 워커가 글을 발행·번역한 직후 부른다 (apps/worker/src/pipeline/announce.ts).
// 사이트맵·언어 홈·피드·카테고리 캐시를 비워, 다음 방문 때 새 글이 들어간 판을 그리게 한다
export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  for (const path of parsed.data.paths) revalidatePath(path);
  return NextResponse.json({ revalidated: parsed.data.paths.length }, { headers: NO_STORE });
}
