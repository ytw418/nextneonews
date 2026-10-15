import { prisma } from "@kmedia/db";

// 기사 조회 수 +1 (인기·추천 글 순위용). 브라우저가 세션마다 글당 한 번만 보낸다 (ViewPing)
export async function POST(_request: Request, { params }: RouteContext<"/api/views/[id]">) {
  const { id } = await params;
  await prisma.article.updateMany({ where: { id, status: "PUBLISHED" }, data: { views: { increment: 1 } } });
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
