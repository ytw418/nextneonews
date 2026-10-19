import { articlePath, categorySlug, type CategoryKey, CHARTS, localeHomePath, LOCALES, UPCOMING } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { log } from "../log";
import {
  CACHE_TAG,
  DAILY_SITEMAP_PATTERNS,
  DEPLOY_SITEMAP_PATTERNS,
  fetchSiteText,
  pickSitemapPaths,
  revalidateSite,
  type SiteRefresh,
  warm,
} from "./site";

// 글을 내지 않아도 바뀌는 화면을 정해진 때에만 다시 그린다 (파이프라인이 DB 를 깨워 둔 동안).
// 웹 화면은 시간이 지나도 다시 만들지 않으므로(revalidate = false) 여기서 비우지 않으면 다음 배포까지 그대로다.
//   date: KST 날짜가 바뀐 뒤 첫 실행 — D-day 가 들어간 홈·일정
//   day:  매일 05시 랭킹 뒤 — 랭킹·인물(색인 대상)·가이드 섹션·llms.txt·최근/반응이 온 글 (+ date 화면)
//   week: 주 1번 — 쪽 번호 화면(/news/page/n, /c/{cat}/page/n). 새 글이 쌓이며 밀린다
//   deploy: 운영 배포 직후 — 배포마다 화면 캐시가 비어, 빌드 때 만들지 않는 글·인물 화면을 미리 그린다 (비우기 없음)
export const REFRESH_SETS = ["date", "day", "week", "deploy"] as const;
export type RefreshSet = (typeof REFRESH_SETS)[number];

export function isRefreshSet(value: string): value is RefreshSet {
  return (REFRESH_SETS as readonly string[]).includes(value);
}

// 랭킹 차트 주소 (apps/web/src/lib/rankings.ts CHART_IDS)
const CHART_IDS = [...Object.keys(CHARTS), "fan-pick"];

const HOUR_MS = 3_600_000;
// 매일 다시 그리는 글: 최근 48시간에 낸 글(번역이 붙고 관련·인기 글이 바뀐다) + 하루 사이 댓글·반응·투표가 온 글(화면의 숫자)
const RECENT_MS = 48 * HOUR_MS;
const ENGAGED_MS = 26 * HOUR_MS; // 하루 + 실행이 밀릴 때 여유
const MAX_ARTICLE_PATHS = 1500;

// 쪽 번호 화면 (apps/web/src/lib/feed.ts FIRST_PAGE_SIZE·PAGE_SIZE 와 같은 수): 1쪽 30개, 2쪽부터 20개씩
const FIRST_PAGE_SIZE = 30;
const PAGE_SIZE = 20;
const PAGED_ROUTES = ["/[locale]/news/page/[n]", "/[locale]/c/[category]/page/[n]"];

function lastPage(total: number): number {
  return total <= FIRST_PAGE_SIZE ? 1 : 1 + Math.ceil((total - FIRST_PAGE_SIZE) / PAGE_SIZE);
}

interface Plan {
  revalidate: SiteRefresh;
  warm: string[];
}

const homes = () => LOCALES.map((l) => localeHomePath(l));

function datePlan(): Plan {
  const paths = homes().flatMap((home) => [home, `${home}/schedule`, ...UPCOMING.map((e) => `${home}/schedule/${e.id}`)]);
  return { revalidate: { paths }, warm: paths };
}

// 최근에 낸 글과 하루 사이 사람이 댓글·반응·투표를 남긴 글의 모든 언어판
async function activeArticlePaths(): Promise<string[]> {
  const now = Date.now();
  const recent = new Date(now - RECENT_MS);
  const since = new Date(now - ENGAGED_MS);
  const rows = await prisma.translation.findMany({
    where: {
      article: {
        status: "PUBLISHED",
        OR: [
          { publishedAt: { gte: recent } },
          { comments: { some: { updatedAt: { gte: since } } } },
          { reactionVotes: { some: { createdAt: { gte: since } } } },
          { poll: { votes: { some: { createdAt: { gte: since } } } } },
        ],
      },
    },
    orderBy: { article: { publishedAt: "desc" } },
    take: MAX_ARTICLE_PATHS,
    select: { locale: true, slug: true },
  });
  return rows.map((r) => articlePath(r.locale, r.slug));
}

// 하루 1번 레이아웃째 다시 그리는 가이드 섹션 (투표 집계를 공유 캐시로 쓰는 곳)
const GUIDE_LAYOUTS = ["/[locale]/beauty"];

async function dayPlan(): Promise<Plan> {
  // 사이트맵부터 새로 그려 받는다 (인물·가이드 주소 목록)
  await revalidateSite({ paths: ["/sitemap.xml"] });
  const sitemap = await fetchSiteText("/sitemap.xml");
  if (!sitemap) log.warn("refresh: sitemap unavailable, skipping idol and guide pages");
  const fromSitemap = sitemap ? pickSitemapPaths(sitemap, DAILY_SITEMAP_PATTERNS) : [];
  // 랭킹 태그를 비우면 그 값을 쓰는 화면(홈·랭킹·드라마 허브, 9개 언어)이 함께 낡은 판이 된다. 사이트맵에 없는 언어도 여기서 그린다
  const rankings = homes().flatMap((home) => [
    `${home}/rankings`,
    ...CHART_IDS.map((c) => `${home}/rankings/${c}`),
    `${home}/drama`,
  ]);
  // 뉴스 사이트맵은 최근 48시간 글만 싣는다. 글이 하루 넘게 안 나와도 지난 글이 빠지게 하루 1번 다시 그린다
  const paths = [
    ...datePlan().warm,
    ...rankings,
    "/llms.txt",
    "/news-sitemap.xml",
    ...(await activeArticlePaths()),
    ...fromSitemap,
  ];
  // 뷰티 화면은 투표 집계를 공유 캐시 하나로 같이 쓴다. 화면을 하나씩 비우면 그 캐시가 남으므로 레이아웃째 비운다 (apps/web/src/app/[locale]/beauty/data.ts)
  return { revalidate: { paths, layouts: GUIDE_LAYOUTS, tags: [CACHE_TAG.rankings] }, warm: paths };
}

// 배포 직후: 비울 것은 없고(새 배포는 빈 캐시로 시작한다) 사이트맵의 글·인물 화면과 최근 글의 모든 언어판을 미리 요청한다.
// 미리 그리지 않으면 그날 봇이 오는 대로 하나씩 그리며 DB 를 하루 내내 띄엄띄엄 깨운다
async function deployPlan(): Promise<Plan> {
  const sitemap = await fetchSiteText("/sitemap.xml");
  if (!sitemap) log.warn("refresh: sitemap unavailable, warming recent articles only");
  const fromSitemap = sitemap ? pickSitemapPaths(sitemap, DEPLOY_SITEMAP_PATTERNS) : [];
  return { revalidate: { paths: [] }, warm: [...(await activeArticlePaths()), ...fromSitemap] };
}

// 쪽 번호 화면은 경로 모양으로 한꺼번에 비우고, 지금 있는 쪽만 다시 요청한다
async function weekPlan(): Promise<Plan> {
  const rows = await prisma.$queryRaw<{ locale: string; category: string; n: number }[]>`
    SELECT t.locale, a.category::text AS category, COUNT(*)::int AS n
    FROM "Translation" AS t JOIN "Article" AS a ON a.id = t."articleId"
    WHERE a.status = 'PUBLISHED'
    GROUP BY t.locale, a.category`;
  const totals = new Map<string, number>();
  const warmPaths: string[] = [];
  for (const { locale, category, n } of rows) {
    totals.set(locale, (totals.get(locale) ?? 0) + n);
    const base = `${localeHomePath(locale)}/c/${categorySlug(category as CategoryKey)}`;
    for (let page = 2; page <= lastPage(n); page++) warmPaths.push(`${base}/page/${page}`);
  }
  for (const [locale, total] of totals) {
    for (let page = 2; page <= lastPage(total); page++) warmPaths.push(`${localeHomePath(locale)}/news/page/${page}`);
  }
  return { revalidate: { paths: [], pages: PAGED_ROUTES }, warm: warmPaths };
}

const PLANS: Record<RefreshSet, () => Plan | Promise<Plan>> = {
  date: datePlan,
  day: dayPlan,
  week: weekPlan,
  deploy: deployPlan,
};

export async function refreshSite(sets: RefreshSet[]): Promise<void> {
  const plans = await Promise.all([...new Set(sets)].map((set) => PLANS[set]()));
  const merged: Required<SiteRefresh> = { paths: [], pages: [], layouts: [], tags: [] };
  for (const { revalidate } of plans) {
    merged.paths.push(...revalidate.paths);
    merged.pages.push(...(revalidate.pages ?? []));
    merged.layouts.push(...(revalidate.layouts ?? []));
    merged.tags.push(...(revalidate.tags ?? []));
  }
  await revalidateSite({
    paths: merged.paths,
    pages: [...new Set(merged.pages)],
    layouts: [...new Set(merged.layouts)],
    tags: [...new Set(merged.tags)],
  });
  await warm(plans.flatMap((plan) => plan.warm));
  log.info("refresh: done", { sets });
}
