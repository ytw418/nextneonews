import {
  categorySlug,
  CHARTS,
  type Locale,
  LOCALE_NAME,
  LOCALE_PATH_PREFIX,
  LOCALES,
  listUpcoming,
  type RankingItem,
  SITE_NAME,
} from "@kmedia/core";
import { type ArticleFormat, prisma } from "@kmedia/db";
import { getTranslations } from "next-intl/server";

import { listActiveCategories } from "@/lib/articles";
import { articlePath, feedPath, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

// AI 가 읽는 안내라 영어로만 쓴다. 차트 화면 이름은 Rankings 문구와 같은 뜻으로
const CHART_NAME: Record<string, string> = {
  kpop: "K-pop Buzz Chart",
  actors: "Korean Actor Buzz Chart",
  kdrama: "K-drama Buzz Chart",
  "fan-pick": "Weekly Fan Pick",
};
const WEEK_PERIOD = /^[0-9]{4}-w[0-9]{2}$/;

const en = (path: string) => `${SITE_URL}${LOCALE_PATH_PREFIX.en}${path}`;

// 색인 대상 글만 (검색에 내지 않는 자동 번역 글은 AI 에도 권하지 않는다)
async function latest(locale: Locale, format: { equals: ArticleFormat } | { not: ArticleFormat }, take: number) {
  return prisma.translation.findMany({
    where: { locale, indexable: true, article: { status: "PUBLISHED", format } },
    orderBy: [{ article: { publishedAt: "desc" } }, { articleId: "desc" }],
    take,
    select: { slug: true, title: true, summary: true },
  });
}

// 차트마다 가장 최근 스냅숏의 1~3위로 답부터 쓰는 한 줄 (랭킹 페이지의 첫 문장과 같은 모양)
async function rankingLines(): Promise<string[]> {
  const charts = [...Object.keys(CHARTS), "fan-pick"];
  const snapshots = await Promise.all(
    charts.map((chart) =>
      prisma.rankingSnapshot.findFirst({
        where: { chart, scope: "all" },
        orderBy: { publishedAt: "desc" },
        select: { chart: true, period: true, items: true },
      }),
    ),
  );
  return snapshots.flatMap((s) => {
    if (!s || !Array.isArray(s.items)) return [];
    const names = (s.items as unknown as RankingItem[])
      .toSorted((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map((item) => item.names.en ?? item.names.ko ?? item.entityId);
    if (names.length === 0) return [];
    const name = CHART_NAME[s.chart] ?? s.chart;
    const when = WEEK_PERIOD.test(s.period) ? `in week ${s.period}` : `on ${s.period}`;
    const rest = names.length > 1 ? `, followed by ${names.slice(1).join(" and ")}` : "";
    return [`- [${name}](${en(`/rankings/${s.chart}`)}): ${names[0]} tops the ${name} ${when}${rest}.`];
  });
}

// llms.txt: AI 에이전트가 사이트 구조·주소 규칙·편집 기준·피드와 최신 글을 한 번에 파악하도록 하는 안내 (https://llmstxt.org)
export async function GET() {
  const [tCat, categories, ranking, guidesEn, guidesJa, guidesZhTw, newsEn] = await Promise.all([
    getTranslations({ locale: "en", namespace: "Category" }),
    listActiveCategories("en"),
    rankingLines(),
    latest("en", { equals: "GUIDE" }, 15),
    latest("ja", { equals: "GUIDE" }, 15),
    latest("zh-TW", { equals: "GUIDE" }, 15),
    latest("en", { not: "GUIDE" }, 20),
  ]);
  const list = (locale: Locale, rows: Awaited<ReturnType<typeof latest>>) =>
    rows.map((a) => `- [${a.title}](${SITE_URL}${articlePath(locale, a.slug)}): ${a.summary}`);
  const events = listUpcoming().slice(0, 10);

  const lines = [
    `# ${SITE_NAME}`,
    "",
    "> Multilingual news and guides about Korean entertainment (K-pop, K-drama), food, travel, working holidays and life in Korea, written for international readers in English, Japanese, Traditional and Simplified Chinese, Korean, Vietnamese, Indonesian, French and Russian. Facts come from official announcements and Korean media, and every article lists its sources.",
    "",
    "Articles are written and translated with AI from official announcements and Korean media reports. Each article page carries this notice, a key-points box, an FAQ and its source links.",
    "",
    "## Languages and URLs",
    `- Article URLs follow ${SITE_URL}/{locale}/news/{slug}. Locale prefixes are lowercase: ${LOCALES.map((l) => `${LOCALE_PATH_PREFIX[l]} (${LOCALE_NAME[l]})`).join(", ")}.`,
    "- English, Japanese and Traditional Chinese are the primary editions. hreflang lists only the languages where a translation exists and is indexed; a language URL without a translation redirects to one that has it.",
    `- Every article has a plain Markdown version: append /md to the article URL (e.g. ${SITE_URL}/en/news/{slug}/md).`,
    ...LOCALES.map((l) => `- [${LOCALE_NAME[l]}](${SITE_URL}${LOCALE_PATH_PREFIX[l]})`),
    "",
    "## Sections",
    ...categories.map((c) => `- [${tCat(c)}](${en(`/c/${categorySlug(c)}`)})`),
    "",
    "## Rankings",
    "Daily charts computed by code (no AI) from Korean buzz signals and worldwide interest, refreshed every day at 05:00 KST, with weekly archives that never change after publication.",
    ...(ranking.length > 0 ? ranking : ["- The first charts are being prepared."]),
    `- [All rankings](${en("/rankings")})`,
    `- [How the rankings are calculated](${en("/rankings/methodology")}): signals, weights, sources and licenses.`,
    `- JSON API: ${SITE_URL}/api/rankings/{chart}/history?days=90&top=30 (add &format=csv for CSV), chart = ${[...Object.keys(CHARTS), "fan-pick"].join(" | ")}. License: CC BY 4.0.`,
    "",
    "## Schedule",
    `- [K-pop comebacks, awards and concerts](${en("/schedule")}): dates in Korea time (KST), venues and how to watch.`,
    `- Calendar files (.ics) for each event: ${SITE_URL}/api/calendar/{locale}/{event-id}`,
    ...events.map(
      (e) =>
        `- [${e.name}](${en(`/schedule/${e.id}`)}): ${e.start}${e.end && e.end !== e.start ? ` to ${e.end}` : ""}${e.city ? `, ${e.city.en}` : ""} — [.ics](${SITE_URL}/api/calendar/en/${e.id})`,
    ),
    "",
    "## Editorial standards",
    "- Facts and numbers come from official announcements, news agencies and Korean media, and each article links its sources.",
    "- Community sites (such as theqoo) are used only as reaction signals: we summarize reactions in our own words, quote at most two short phrases, link the original post and never re-upload community images or nicknames.",
    "- Photos are official images or Creative Commons photos credited with author and license.",
    `- [About us](${en("/about")}) · [Editorial policy](${en("/editorial-policy")}) · [Contact and corrections](${en("/contact")})`,
    "",
    "## Feeds and sitemaps",
    ...LOCALES.map((l) => `- [RSS (${LOCALE_NAME[l]})](${SITE_URL}${feedPath(l)})`),
    `- [Sitemap](${SITE_URL}/sitemap.xml)`,
    `- [News sitemap](${SITE_URL}/news-sitemap.xml): articles from the last 48 hours`,
    "",
    "## Latest guides (English)",
    ...list("en", guidesEn),
    "",
    "## Latest guides (日本語)",
    ...list("ja", guidesJa),
    "",
    "## Latest guides (繁體中文)",
    ...list("zh-TW", guidesZhTw),
    "",
    "## Latest news (English)",
    ...list("en", newsEn),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
