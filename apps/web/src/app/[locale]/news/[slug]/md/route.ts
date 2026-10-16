import { faqNotInBody, SITE_NAME } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { getArticle } from "@/lib/articles";
import { publisherName } from "@/lib/publishers";
import { articlePath, localeFromPrefix, SITE_URL } from "@/lib/url";

// 글의 마크다운판 (/en/news/{slug}/md). AI 에이전트가 HTML 없이 본문·핵심 요약·FAQ·출처를 한 번에 읽는다.
// 검색에는 HTML 글만 나가게 noindex + canonical 헤더를 단다
export const revalidate = 300;

export function generateStaticParams() {
  return [];
}

interface Faq {
  q: string;
  a: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function GET(_request: Request, ctx: RouteContext<"/[locale]/news/[slug]/md">) {
  const params = await ctx.params;
  // 미들웨어를 거치면 zh-TW, 거치지 않으면 zh-tw 로 들어온다
  const locale = localeFromPrefix(params.locale);
  const translation = locale ? await getArticle(locale, params.slug) : null;
  if (!locale || !translation) return new Response("Not found", { status: 404 });

  const { article } = translation;
  const t = await getTranslations({ locale, namespace: "Article" });
  const url = `${SITE_URL}${articlePath(locale, translation.slug)}`;
  const keyPoints = asArray<string>(translation.keyPoints);
  const faq = faqNotInBody(asArray<Faq>(translation.faq), translation.body);

  const lines = [
    `# ${translation.title}`,
    "",
    `- URL: ${url}`,
    ...(article.publishedAt ? [`- Published: ${article.publishedAt.toISOString()}`] : []),
    `- Publisher: ${SITE_NAME}`,
    "",
    `> ${translation.summary}`,
    "",
    ...(keyPoints.length > 0 ? [`## ${t("keyPoints")}`, "", ...keyPoints.map((p, i) => `${i + 1}. ${p}`), ""] : []),
    translation.body.trim(),
    "",
    ...(faq.length > 0 ? [`## ${t("faq")}`, "", ...faq.flatMap((f) => [`### ${f.q}`, "", f.a, ""])] : []),
    ...(article.sources.length > 0
      ? [`## ${t("sources")}`, "", ...article.sources.map((s) => `- [${publisherName(s.publisher, locale)}](${s.url})`), ""]
      : []),
    `_${t("aiNotice")}_`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "x-robots-tag": "noindex",
      link: `<${url}>; rel="canonical"`,
    },
  });
}
