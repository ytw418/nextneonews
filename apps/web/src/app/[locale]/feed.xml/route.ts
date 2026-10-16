import { LOCALE_NAME, LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { listLatest } from "@/lib/articles";
import imageLoader from "@/lib/image";
import { articlePath, feedPath, localeFromPrefix, SITE_URL } from "@/lib/url";
import { xmlEscape } from "@/lib/xml";

// 언어별 RSS 2.0 (최신 50개). Feedly·Flipboard·AI 수집기·SNS 자동 게시가 읽는다.
// 언어 미들웨어(proxy.ts)가 점 붙은 경로를 건너뛰어 locale 자리에 주소 접두사(zh-tw)가 그대로 들어온다
export const revalidate = 600;

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: LOCALE_PATH_PREFIX[l].slice(1) }));
}

const AUTHOR = `${SITE_NAME} Newsroom`;

export async function GET(_request: Request, ctx: RouteContext<"/[locale]/feed.xml">) {
  const { locale: prefix } = await ctx.params;
  const locale = localeFromPrefix(prefix);
  if (!locale) return new Response("Not found", { status: 404 });

  const [tSite, tCat, rows] = await Promise.all([
    getTranslations({ locale, namespace: "Site" }),
    getTranslations({ locale, namespace: "Category" }),
    listLatest(locale, 50),
  ]);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const self = `${SITE_URL}${feedPath(locale)}`;
  const built = rows[0]?.article.publishedAt ?? new Date();

  const items = rows.map((row) => {
    const url = `${SITE_URL}${articlePath(locale, row.slug)}`;
    const image = row.article.media[0]?.url;
    return `    <item>
      <title>${xmlEscape(row.title)}</title>
      <link>${xmlEscape(url)}</link>
      <guid isPermaLink="true">${xmlEscape(url)}</guid>
      ${row.article.publishedAt ? `<pubDate>${row.article.publishedAt.toUTCString()}</pubDate>` : ""}
      <description>${xmlEscape(row.summary)}</description>
      <category>${xmlEscape(tCat(row.article.category))}</category>
      <dc:creator>${xmlEscape(AUTHOR)}</dc:creator>${
        image
          ? `
      <media:content url="${xmlEscape(imageLoader({ src: image, width: 960 }))}" medium="image" />`
          : ""
      }
    </item>`;
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${xmlEscape(`${SITE_NAME} (${LOCALE_NAME[locale]})`)}</title>
    <link>${xmlEscape(home)}</link>
    <description>${xmlEscape(tSite("tagline"))}</description>
    <language>${locale.toLowerCase()}</language>
    <lastBuildDate>${built.toUTCString()}</lastBuildDate>
    <atom:link href="${xmlEscape(self)}" rel="self" type="application/rss+xml" />
${items.join("\n")}
  </channel>
</rss>
`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
