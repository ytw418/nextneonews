import { prisma } from "@kmedia/db";

import { isRecordId, rejectWrite } from "@/lib/api-guard";
import { clientIp, ipHash } from "@/lib/comments";
import { isDbUnavailable } from "@/lib/item-votes";
import { isBot } from "@/lib/voter";

// 한 사람(IP 해시)이 이 시간 안에 올릴 수 있는 조회 수. 사람은 10분에 글 20편을 새로 열지 않는다
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 20;
// 기억해 두는 사람 수 상한 (넘으면 비우고 다시 센다 — 메모리가 끝없이 늘지 않게)
const MAX_TRACKED = 5_000;
// 시간별 조회 칸은 '실시간 인기'(24시간)·주간 비교에만 쓴다. 기록 100번에 한 번꼴로 8일 지난 칸을 지운다
const HOUR_KEEP_DAYS = 8;
const PRUNE_RATE = 0.01;

// 함수 인스턴스 메모리에 두는 횟수 제한: DB 를 깨우지 않고 거른다. 인스턴스마다 따로 세서 느슨하지만,
// 스크립트 한 대가 인기 순위를 올리려고 연달아 보내는 것은 막는다 (확실한 제한은 Vercel 방화벽 규칙이 맡는다)
const recent = new Map<string, { start: number; count: number }>();

function overLimit(key: string, now: number): boolean {
  const entry = recent.get(key);
  if (!entry || now - entry.start >= WINDOW_MS) {
    if (recent.size >= MAX_TRACKED) recent.clear();
    recent.set(key, { start: now, count: 1 });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}

// 기사 조회 수 +1 (인기·추천 글 순위용) + 이 시간 칸 +1 ('실시간 인기'). 브라우저가 세션마다 글당 한 번만 보낸다 (ViewPing).
// 봇·모양이 틀린 id·너무 잦은 요청은 DB 에 닿지 않고 204 로 끝낸다 (보낸 쪽이 할 일이 없어 같은 응답)
// Prisma update 는 updatedAt 을 지금으로 바꿔서, 조회만 해도 글에 '업데이트'가 찍힌다 → SQL 로 views 만 올린다
export async function POST(request: Request, { params }: RouteContext<"/api/views/[id]">) {
  const blocked = rejectWrite(request, { json: false });
  if (blocked) return blocked;
  const { id } = await params;
  const done = new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
  if (!isRecordId(id) || isBot(request.headers.get("user-agent"))) return done;
  if (overLimit(ipHash(clientIp(request.headers)), Date.now())) return done;
  try {
    const updated = await prisma.$executeRaw`UPDATE "Article" SET "views" = "views" + 1 WHERE "id" = ${id} AND "status" = 'PUBLISHED'`;
    // 시간 칸은 덤이라 실패해도(마이그레이션 전 등) 누적 조회는 그대로 둔다
    if (updated > 0) {
      await prisma.$executeRaw`
        INSERT INTO "ArticleViewHour" ("articleId", "hour", "count") VALUES (${id}, date_trunc('hour', now() AT TIME ZONE 'UTC'), 1)
        ON CONFLICT ("articleId", "hour") DO UPDATE SET "count" = "ArticleViewHour"."count" + 1`.catch(() => 0);
    }
    if (Math.random() < PRUNE_RATE) {
      await prisma.$executeRaw`DELETE FROM "ArticleViewHour" WHERE "hour" < now() AT TIME ZONE 'UTC' - make_interval(days => ${HOUR_KEEP_DAYS})`.catch(() => 0);
    }
  } catch (err) {
    // DB 가 멈춘 동안의 조회는 버린다 (조회 수 한 칸 때문에 오류 로그가 쌓이지 않게)
    if (!isDbUnavailable(err)) throw err;
  }
  return done;
}
