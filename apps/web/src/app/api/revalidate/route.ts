import { timingSafeEqual } from "node:crypto";

import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

import { CATEGORIES_TAG } from "@/lib/articles";
import { RANKINGS_TAG } from "@/lib/rankings";

const NO_STORE = { "cache-control": "no-store" };

// 한 번에 받는 수 (worker 가 이 크기로 나눠 보낸다 — apps/worker/src/pipeline/site.ts)
const MAX_PATHS = 50;
const MAX_PAGE_PATTERNS = 10;
const TAGS = [CATEGORIES_TAG, RANKINGS_TAG] as const;

const Body = z
  .object({
    // 실제로 그리는 경로 (미들웨어가 /zh-tw → /zh-TW 로 바꾸므로 페이지는 로케일 코드로 받는다)
    paths: z.array(z.string().startsWith("/").max(1024)).max(MAX_PATHS).default([]),
    // 동적 경로 모양 ('/[locale]/news/page/[n]'). 그 page 파일로 그린 주소를 모두 비운다
    pages: z.array(z.string().startsWith("/").includes("[").max(1024)).max(MAX_PAGE_PATTERNS).default([]),
    // 요청을 넘어 공유하는 데이터 캐시 (lib/articles.ts·lib/rankings.ts). 이 태그를 쓴 화면도 함께 비워진다
    tags: z.array(z.enum(TAGS)).max(TAGS.length).default([]),
  })
  .refine((body) => body.paths.length + body.pages.length + body.tags.length > 0);

function authorized(header: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !header) return false;
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// 워커가 글을 발행·번역·내린 직후와 하루 일정(자정·05시 랭킹 뒤·주 1번)에 부른다 (apps/worker/src/pipeline/announce.ts·refresh.ts).
// 화면은 시간이 지나도 다시 만들지 않으므로(revalidate = false) 여기서 비운 주소만 다음 요청 때 새로 그린다.
// 워커가 비운 직후 그 주소를 한 번씩 요청해서, 다시 그리는 일이 DB 가 깨어 있는 파이프라인 시간 안에 끝난다
export async function POST(request: Request) {
  if (!authorized(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const { paths, pages, tags } = parsed.data;
  // 태그는 오래된 값을 한 번 더 내주며 뒤에서 새로 만든다('max'). 워커가 곧바로 다시 요청하므로 묵은 판은 그 한 번뿐이다
  for (const tag of tags) revalidateTag(tag, "max");
  for (const pattern of pages) revalidatePath(pattern, "page");
  for (const path of paths) revalidatePath(path);
  return NextResponse.json(
    { revalidated: paths.length, pages: pages.length, tags: tags.length },
    { headers: NO_STORE },
  );
}
