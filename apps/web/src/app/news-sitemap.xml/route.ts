import { SITE_NAME } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { articlePath, SITE_URL } from "@/lib/url";
import { xmlEscape } from "@/lib/xml";

// 구글 뉴스 사이트맵: 최근 48시간에 발행한 색인 대상 글만, 최대 1000개 (developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap).
// 자동 발행 직후 worker 의 announce 가 /api/revalidate 로 비우고 바로 다시 요청한다. 시간 기반 재생성은 하지 않는다
export const revalidate = false;

const WINDOW_MS = 48 * 3_600_000;
const MAX_URLS = 1000;

export async function GET() {
  const rows = await prisma.translation.findMany({
    where: {
      indexable: true,
      article: { status: "PUBLISHED", publishedAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    },
    orderBy: [{ article: { publishedAt: "desc" } }, { articleId: "desc" }],
    take: MAX_URLS,
    select: { locale: true, slug: true, title: true, article: { select: { publishedAt: true } } },
  });

  const urls = rows.map(
    (r) => `  <url>
    <loc>${xmlEscape(`${SITE_URL}${articlePath(r.locale, r.slug)}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${xmlEscape(SITE_NAME)}</news:name>
        <news:language>${r.locale.toLowerCase()}</news:language>
      </news:publication>
      <news:publication_date>${r.article.publishedAt?.toISOString()}</news:publication_date>
      <news:title>${xmlEscape(r.title)}</news:title>
    </news:news>
  </url>`,
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls.join("\n")}
</urlset>
`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
}
