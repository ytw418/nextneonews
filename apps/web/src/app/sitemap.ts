import type { MetadataRoute } from "next";

import {
  type CategoryKey,
  categorySlug,
  CHARTS,
  type Locale,
  LOCALE_PATH_PREFIX,
  LOCALES,
  type RankingItem,
  UPCOMING,
} from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { listBeauty } from "@/data/beauty";
import { BEAUTY_CATEGORIES, SKIN_TYPES } from "@/data/beauty/types";
import { listClinic } from "@/data/clinic";
import { listDrama } from "@/data/drama";
import { listAreas, listTravel } from "@/data/travel";
import { listActiveCategories, listSitemapEntries } from "@/lib/articles";
import { GUIDE_INDEX_LOCALES, guideIndexable } from "@/lib/guide-seo";
import { articlePath, SITE_URL } from "@/lib/url";
import { xmlEscape } from "@/lib/xml";

export const revalidate = 3600;

const abs = (path: string) => `${SITE_URL}${path}`;
const DAY_MS = 86_400_000;
const WEEK_PERIOD = /^[0-9]{4}-w[0-9]{2}$/;
const CHART_IDS: readonly string[] = [...Object.keys(CHARTS), "fan-pick"];

// 언어별 주소 → hreflang. 영어판이 있으면 x-default 로 함께 적는다
function hreflang(paths: Record<string, string>) {
  const languages = Object.fromEntries(Object.entries(paths).map(([l, p]) => [l, abs(p)]));
  if (languages.en) languages["x-default"] = languages.en;
  return { languages };
}

// 9개 언어 모두에 있는 화면 (홈·일정·랭킹·인물·소개 페이지)
function everyLocale(subpath: string, extra: Omit<MetadataRoute.Sitemap[number], "url" | "alternates"> = {}) {
  const alternates = hreflang(Object.fromEntries(LOCALES.map((l) => [l, `${LOCALE_PATH_PREFIX[l]}${subpath}`])));
  return LOCALES.map((l) => ({ url: abs(`${LOCALE_PATH_PREFIX[l]}${subpath}`), alternates, ...extra }));
}

// 랭킹: 허브·계산 방법·스냅숏이 있는 차트·주간 고정판, 최근 30일 차트 상위 30 에 든 인물 페이지 (idol-pages 의 색인 규칙과 같은 기준).
// 스냅숏이 하나도 없으면 랭킹 화면은 빈 상태(noindex)라 넣지 않는다
async function rankingEntries(): Promise<MetadataRoute.Sitemap> {
  const where = { scope: "all", chart: { in: [...CHART_IDS] } };
  const [snapshots, recent] = await Promise.all([
    prisma.rankingSnapshot.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      select: { chart: true, period: true, publishedAt: true },
    }),
    prisma.rankingSnapshot.findMany({
      where: { ...where, publishedAt: { gte: new Date(Date.now() - 30 * DAY_MS) } },
      select: { items: true },
    }),
  ]);
  if (snapshots.length === 0) return [];

  const latestByChart = new Map<string, Date>();
  for (const s of snapshots) {
    if (!latestByChart.has(s.chart)) latestByChart.set(s.chart, s.publishedAt);
  }
  const entityIds = new Set(
    recent
      .flatMap((s) => (Array.isArray(s.items) ? (s.items as unknown as RankingItem[]) : []))
      .filter((item) => item.rank <= 30)
      .map((item) => item.entityId),
  );
  const idols = await prisma.entity.findMany({
    where: { id: { in: [...entityIds] }, slug: { not: null } },
    select: { slug: true },
  });

  return [
    ...everyLocale("/rankings", { lastModified: snapshots[0].publishedAt, changeFrequency: "daily", priority: 0.8 }),
    ...everyLocale("/rankings/methodology", { changeFrequency: "monthly", priority: 0.4 }),
    ...[...latestByChart].flatMap(([chart, at]) =>
      everyLocale(`/rankings/${chart}`, { lastModified: at, changeFrequency: "daily", priority: 0.8 }),
    ),
    ...snapshots
      .filter((s) => WEEK_PERIOD.test(s.period))
      .flatMap((s) => everyLocale(`/rankings/${s.chart}/${s.period}`, { lastModified: s.publishedAt, priority: 0.5 })),
    ...idols.flatMap((e) => everyLocale(`/idol/${e.slug}`, { changeFrequency: "weekly", priority: 0.6 })),
  ];
}

// 가이드 섹션(뷰티·여행·클리닉·드라마): 검색에 내는 언어(en·ja·zh-TW)만 적고 hreflang 도 그 언어끼리 잇는다.
// 치과·성형 시술은 모든 언어에서 뺀다 (next.config.ts 가 같은 목록으로 noindex 헤더를 단다 — lib/guide-seo.ts).
// 카탈로그 항목은 영어 문구가 있는 것만(로더가 거른다), 날짜는 카탈로그에 넣은 날
async function guideEntries(): Promise<MetadataRoute.Sitemap> {
  const [products, places, areas, procedures, dramas] = await Promise.all([
    listBeauty("en"),
    listTravel("en"),
    listAreas("en"),
    listClinic("en"),
    listDrama("en"),
  ]);
  const pages: { path: string; priority: number; lastModified?: string }[] = [
    { path: "/guide", priority: 0.7 },
    { path: "/beauty", priority: 0.7 },
    ...BEAUTY_CATEGORIES.map((c) => ({ path: `/beauty/awards/${c}`, priority: 0.6 })),
    ...products.map((p) => ({ path: `/beauty/p/${p.slug}`, priority: 0.6, lastModified: p.addedAt })),
    { path: "/beauty/skin-type", priority: 0.6 },
    ...SKIN_TYPES.map((type) => ({ path: `/beauty/skin-type/${type}`, priority: 0.4 })),
    { path: "/travel", priority: 0.7 },
    ...areas.map((a) => ({ path: `/travel/${a.slug}`, priority: 0.6 })),
    ...places.map((p) => ({ path: `/travel/place/${p.slug}`, priority: 0.6, lastModified: p.addedAt })),
    { path: "/clinic", priority: 0.5 },
    { path: "/clinic/how-to-choose", priority: 0.5 },
    ...procedures.map((p) => ({ path: `/clinic/${p.slug}`, priority: 0.5, lastModified: p.addedAt })),
    { path: "/drama", priority: 0.7 },
    ...dramas.map((d) => ({ path: `/drama/${d.slug}`, priority: 0.6, lastModified: d.addedAt })),
  ];
  return pages.flatMap(({ path, priority, lastModified }) => {
    const locales = GUIDE_INDEX_LOCALES.filter((l) => guideIndexable(l, path));
    const alternates = hreflang(Object.fromEntries(locales.map((l) => [l, `${LOCALE_PATH_PREFIX[l]}${path}`])));
    return locales.map((l) => ({
      url: abs(`${LOCALE_PATH_PREFIX[l]}${path}`),
      lastModified,
      changeFrequency: "weekly" as const,
      priority,
      alternates,
    }));
  });
}

// 언어별 URL 마다 다른 언어 대체 링크(hreflang)를 함께 적는다. 글은 색인 대상(indexable)인 번역끼리만 잇는다.
// 저장함(/saved, 이 기기에만 있는 목록)·협찬 안내(/partners)는 noindex 라 넣지 않는다
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [entries, activeByLocale, rankings, guides] = await Promise.all([
    listSitemapEntries(),
    Promise.all(LOCALES.map(async (l) => [l, await listActiveCategories(l)] as const)),
    rankingEntries(),
    guideEntries(),
  ]);

  const byArticle = new Map<string, typeof entries>();
  for (const e of entries) {
    byArticle.set(e.articleId, [...(byArticle.get(e.articleId) ?? []), e]);
  }

  // 글이 없는 카테고리는 빈 페이지라 넣지 않는다. hreflang 도 그 카테고리에 글이 있는 언어끼리만
  const localesByCategory = new Map<CategoryKey, Locale[]>();
  for (const [l, categories] of activeByLocale) {
    for (const c of categories) localesByCategory.set(c, [...(localesByCategory.get(c) ?? []), l]);
  }
  const categoryEntries = [...localesByCategory].flatMap(([c, locales]) => {
    const path = (l: Locale) => `${LOCALE_PATH_PREFIX[l]}/c/${categorySlug(c)}`;
    const alternates = hreflang(Object.fromEntries(locales.map((l) => [l, path(l)])));
    return locales.map((l) => ({ url: abs(path(l)), changeFrequency: "daily" as const, priority: 0.6, alternates }));
  });

  // 소개·편집 방침·개인정보·제휴 고지 (문의는 메일 주소를 설정했을 때만 색인된다). 제휴 고지는 카탈로그가 아니라 신뢰 페이지라 9개 언어 모두
  const trustPages = [
    "/about",
    "/editorial-policy",
    "/privacy",
    "/disclosure",
    ...(process.env.NEXT_PUBLIC_CONTACT_EMAIL ? ["/contact"] : []),
  ];

  return [
    ...everyLocale("", { changeFrequency: "hourly", priority: 1 }),
    ...categoryEntries,
    ...everyLocale("/schedule", { changeFrequency: "daily", priority: 0.7 }),
    ...UPCOMING.flatMap((e) => everyLocale(`/schedule/${e.id}`, { changeFrequency: "weekly", priority: 0.6 })),
    ...rankings,
    ...guides,
    ...trustPages.flatMap((p) => everyLocale(p, { changeFrequency: "monthly", priority: 0.3 })),
    ...entries.map((e) => {
      const siblings = byArticle.get(e.articleId) ?? [];
      return {
        url: abs(articlePath(e.locale, e.slug)),
        // updatedAt 은 조회 수 때문에도 바뀌어서 쓰지 않는다 (제목·본문을 고친 시각만)
        lastModified: e.article.contentUpdatedAt ?? e.article.publishedAt ?? undefined,
        priority: 0.8,
        alternates: hreflang(Object.fromEntries(siblings.map((s) => [s.locale, articlePath(s.locale, s.slug)]))),
        // Next 는 사이트맵 값을 이스케이프하지 않고 그대로 쓴다. 위키미디어 주소의 & 가 XML 전체를 깨뜨렸다
        images: e.article.media.map((m) => xmlEscape(m.url)),
      };
    }),
  ];
}
