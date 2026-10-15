import { prisma } from "@kmedia/db";

// 기사 조회 수 +1 (인기·추천 글 순위용). 브라우저가 세션마다 글당 한 번만 보낸다 (ViewPing).
// Prisma update 는 updatedAt 을 지금으로 바꿔서, 조회만 해도 글에 '업데이트'가 찍힌다 → SQL 로 views 만 올린다
export async function POST(_request: Request, { params }: RouteContext<"/api/views/[id]">) {
  const { id } = await params;
  await prisma.$executeRaw`UPDATE "Article" SET "views" = "views" + 1 WHERE "id" = ${id} AND "status" = 'PUBLISHED'`;
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
