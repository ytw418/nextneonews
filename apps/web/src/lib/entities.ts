import { cache } from "react";

import { CHARTS, type ChartKey, kstDay, type RankingItem, WIKI_LANGS, type WikiLang } from "@kmedia/core";
import { type Entity, type Prisma, prisma } from "@kmedia/db";

import { feedSelect } from "./articles";
import { articleMentions, type MentionTarget } from "./entity-mention";

// 인물·작품 페이지(app/[locale]/idol/[slug]) 조회. 랭킹 재료(EntityMetric)와 발행한 순위(RankingSnapshot)를 읽기만 한다
// (계산은 worker rankings). 서치콘솔 국가별 노출 같은 내부 숫자는 여기서 읽지 않는다

const DAY_MS = 86_400_000;

// generateMetadata 와 본문이 같은 요청에서 한 번만 조회한다
export const getEntityBySlug = cache(async (slug: string): Promise<Entity | null> => {
  return prisma.entity.findUnique({ where: { slug } });
});

// 다른 모양으로 들어온 주소 → 지금 slug (308 로 보낸다). /idol/q12345·/idol/Q12345(위키데이터 Q-id), /idol/BTS(대문자)
export async function canonicalSlug(param: string): Promise<string | null> {
  const lower = param.toLowerCase();
  if (lower !== param) {
    const bySlug = await prisma.entity.findUnique({ where: { slug: lower }, select: { slug: true } });
    if (bySlug?.slug) return bySlug.slug;
  }
  if (!/^q[0-9]+$/.test(lower)) return null;
  const byId = await prisma.entity.findUnique({ where: { id: lower.toUpperCase() }, select: { slug: true } });
  return byId?.slug && byId.slug !== param ? byId.slug : null;
}

// 랭킹 화면의 이름 도우미(displayName·secondaryName)에 그대로 넣는 모양
export function namesOf(entity: Pick<Entity, "en" | "ko" | "ja" | "zhHant">): RankingItem["names"] {
  return { en: entity.en, ko: entity.ko, ja: entity.ja, zhHant: entity.zhHant };
}

// 이 인물이 오르는 차트 (그룹·가수 → kpop, 배우 → actors, 드라마 → kdrama). 어느 차트에도 없는 종류면 null
export function entityChart(type: string): ChartKey | null {
  return (Object.keys(CHARTS) as ChartKey[]).find((chart) => (CHARTS[chart].types as readonly string[]).includes(type)) ?? null;
}

// KST 날짜 n일 전 0시 (EntityMetric.date 는 @db.Date 라 UTC 0시로 넣는다 — worker rankings/metrics.ts dayDate 와 같다)
function kstDate(daysAgo: number): Date {
  return new Date(`${kstDay(new Date(Date.now() - daysAgo * DAY_MS))}T00:00:00Z`);
}

export interface LanguageViews {
  lang: WikiLang;
  views: number;
}

// 위키백과 언어별 최근 N일 조회 합 (많은 순, 0 은 뺀다). 조회 수는 다음 날 들어오므로 어제까지 N일
export async function getLanguageInterest(entityId: string, days = 30): Promise<LanguageViews[]> {
  const rows = await prisma.entityMetric.groupBy({
    by: ["source"],
    where: {
      entityId,
      source: { in: WIKI_LANGS.map((lang) => `wiki:${lang}`) },
      date: { gte: kstDate(days), lt: kstDate(0) },
    },
    _sum: { value: true },
  });
  const views = new Map(rows.map((r) => [r.source.slice("wiki:".length), r._sum.value ?? 0]));
  return WIKI_LANGS.map((lang) => ({ lang, views: Math.round(views.get(lang) ?? 0) }))
    .filter((r) => r.views > 0)
    .sort((a, b) => b.views - a.views);
}

export interface KoreaBuzz {
  posts: number; // 더쿠 핫게 글 수
  views: number;
  comments: number;
  trendDays: number; // 구글 트렌드 KR 에 오른 날 수
  days: number;
}

// 국내 화제: 최근 N일(오늘 포함) 더쿠 글·조회·댓글 합과 구글 트렌드 등장 일수. 숫자만 (글 제목·내용은 읽지 않는다)
export async function getKoreaBuzz(entityId: string, days = 7): Promise<KoreaBuzz> {
  const rows = await prisma.entityMetric.findMany({
    where: {
      entityId,
      source: { in: ["theqoo:posts", "theqoo:views", "theqoo:comments", "trends"] },
      date: { gte: kstDate(days - 1) },
    },
    select: { source: true, value: true },
  });
  const sum = (source: string) => Math.round(rows.filter((r) => r.source === source).reduce((s, r) => s + r.value, 0));
  return {
    posts: sum("theqoo:posts"),
    views: sum("theqoo:views"),
    comments: sum("theqoo:comments"),
    // 트렌드 줄은 그날 검색어에 이름이 나왔을 때만 생긴다 (인물·날짜·종류마다 한 줄)
    trendDays: rows.filter((r) => r.source === "trends").length,
    days,
  };
}

// 차트 매일판 최근 N일의 이 인물 순위 (오래된 날부터, 그날 순위표에 없으면 null — 선이 끊긴다).
// 스냅숏 전체(items JSON)를 90개 받지 않고 이 인물 순위만 DB 에서 꺼낸다
export async function getRankHistory(chart: ChartKey, entityId: string, days = 90): Promise<(number | null)[]> {
  const since = kstDay(new Date(Date.now() - (days - 1) * DAY_MS));
  const rows = await prisma.$queryRaw<{ rank: number | null }[]>`
    SELECT (
      SELECT (i->>'rank')::int FROM jsonb_array_elements(s.items) AS i WHERE i->>'entityId' = ${entityId} LIMIT 1
    ) AS rank
    FROM "RankingSnapshot" AS s
    WHERE s.chart = ${chart} AND s.scope = 'all' AND s.period >= ${since} AND s.period NOT LIKE '%-w%'
    ORDER BY s.period`;
  return rows.map((r) => r.rank);
}

// 색인 기준 하나 (app/sitemap.ts 와 같다): 최근 30일 안에 발행한 차트(전체) 상위 30에 든 적이 있는지
export async function inRecentTop30(entityId: string): Promise<boolean> {
  const since = new Date(Date.now() - 30 * DAY_MS);
  const rows = await prisma.$queryRaw<{ hit: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "RankingSnapshot" AS s, jsonb_array_elements(s.items) AS i
      WHERE s.scope = 'all' AND s."publishedAt" >= ${since}
        AND i->>'entityId' = ${entityId} AND (i->>'rank')::int <= 30
    ) AS hit`;
  return rows[0]?.hit === true;
}

// 관련 글: 글 entities JSON 에 이 인물의 id 나 이름이 있는 글 (최신순). DB 에서는 jsonb @> 로 넓게 찾고,
// 동명이인(같은 영어 이름, 다른 id·한국어 이름)은 articleMentions 로 한 번 더 거른다
export async function listEntityArticles(locale: string, entity: MentionTarget, take = 10) {
  const filters: Prisma.ArticleWhereInput[] = [{ entities: { array_contains: [{ id: entity.id }] } }];
  // 글의 name 은 영어 이름, 영어 이름이 없으면 한국어 이름이다
  const name = entity.en ?? entity.ko;
  if (name) filters.push({ entities: { array_contains: [{ name }] } });
  if (entity.ko) filters.push({ entities: { array_contains: [{ koreanName: entity.ko }] } });

  const rows = await prisma.translation.findMany({
    where: { locale, article: { status: "PUBLISHED", OR: filters } },
    orderBy: [{ article: { publishedAt: "desc" } }, { articleId: "desc" }],
    take: take * 3,
    select: { ...feedSelect, article: { select: { ...feedSelect.article.select, entities: true } } },
  });
  const seen = new Set<string>();
  return rows
    .filter((row) => {
      if (seen.has(row.article.id) || !articleMentions(row.article.entities, entity)) return false;
      seen.add(row.article.id);
      return true;
    })
    .slice(0, take);
}

// JSON-LD sameAs 에 넣는 위키백과 문서 (영어·일본어·한국어). Entity.wikiTitles 는 worker rankings/wiki.ts 가 채운다
const SAME_AS_WIKIS = ["en", "ja", "ko"] as const;
export function wikipediaUrls(wikiTitles: unknown): string[] {
  if (!wikiTitles || typeof wikiTitles !== "object" || Array.isArray(wikiTitles)) return [];
  const titles = wikiTitles as Record<string, unknown>;
  return SAME_AS_WIKIS.flatMap((lang) => {
    const title = titles[lang];
    return typeof title === "string" && title
      ? [`https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`]
      : [];
  });
}
