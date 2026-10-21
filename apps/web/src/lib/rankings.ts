import { unstable_cache } from "next/cache";
import { cache } from "react";

import {
  type ChartId,
  eventMatches,
  type EventWithView,
  formatRange,
  kst,
  kstDay,
  listUpcoming,
  type RankingItem,
  WIKI_LANGS,
  type WikiLang,
} from "@kmedia/core";
import { type Prisma, prisma, type RankingSnapshot } from "@kmedia/db";

import { type EntityPhoto, entityPhoto } from "./entity-image";

// 랭킹 화면(app/[locale]/rankings)·홈 레일·글 칩이 함께 쓰는 조회와 표시 도우미.
// 점수 계산은 worker(rankings) 가 하고, 여기서는 RankingSnapshot 을 읽기만 한다

export const CHART_IDS = ["kpop", "boys", "girls", "actors", "kdrama", "fan-pick"] as const satisfies readonly ChartId[];

export function isChartId(value: string): value is ChartId {
  return (CHART_IDS as readonly string[]).includes(value);
}

// 문구 키 (메시지 키에는 '-' 를 쓰지 않는다)
export const CHART_KEY = { kpop: "kpop", boys: "boys", girls: "girls", actors: "actors", kdrama: "kdrama", "fan-pick": "fanPick" } as const;

// 이니셜 칸의 파스텔: 차트 = 카테고리라 카테고리 틴트를 쓴다 (배우는 셀럽 틴트)
export const CHART_TINT: Record<ChartId, string> = {
  kpop: "var(--tint-kpop)",
  boys: "var(--tint-kdrama)",
  girls: "var(--tint-kbeauty)",
  actors: "var(--tint-kent)",
  kdrama: "var(--tint-kdrama)",
  "fan-pick": "var(--tint-kbeauty)",
};

const WEEK = /^[0-9]{4}-w[0-9]{2}$/;
export function isWeekPeriod(period: string): boolean {
  return WEEK.test(period);
}

export function isWikiLang(value: string): value is WikiLang {
  return (WIKI_LANGS as readonly string[]).includes(value);
}

export interface RankingSource {
  name: string;
  url: string;
  count?: number;
}

export interface Snapshot {
  chart: ChartId;
  scope: string;
  period: string;
  items: RankingItem[];
  sources: RankingSource[];
  method: string;
  publishedAt: Date;
  correction: string | null;
}

function toSnapshot(row: RankingSnapshot): Snapshot {
  const items = Array.isArray(row.items) ? (row.items as unknown as RankingItem[]) : [];
  const sources = Array.isArray(row.sources) ? (row.sources as unknown as RankingSource[]) : [];
  return {
    chart: row.chart as ChartId,
    scope: row.scope,
    period: row.period,
    items: items.filter((i) => i && typeof i.entityId === "string").sort((a, b) => a.rank - b.rank),
    sources: sources.filter((s) => s && typeof s.name === "string"),
    method: row.method,
    publishedAt: row.publishedAt,
    correction: row.correction,
  };
}

// 매일판(YYYY-MM-DD)과 주간 고정본(YYYY-Www)을 period 모양으로 가른다
const DAILY = { not: { contains: "-w" } } satisfies Prisma.StringFilter;
const WEEKLY = { contains: "-w" } satisfies Prisma.StringFilter;

// 요청을 넘어 공유하는 '최신 차트' 캐시의 태그. 하루 1번 랭킹을 만든 뒤 worker 가 /api/revalidate 로 비운다
// (apps/worker/src/pipeline/site.ts 와 같은 이름)
export const RANKINGS_TAG = "rankings";

async function findLatest(chart: ChartId, scope: string): Promise<Snapshot | null> {
  const row = await prisma.rankingSnapshot.findFirst({
    where: { chart, scope, period: chart === "fan-pick" ? WEEKLY : DAILY },
    orderBy: { period: "desc" },
  });
  return row ? toSnapshot(row) : null;
}

// 데이터 캐시는 JSON 으로 남아 Date 가 문자열이 된다. 발행 시각은 ISO 로 넣고 꺼낼 때 Date 로 되돌린다
type StoredSnapshot = Omit<Snapshot, "publishedAt"> & { publishedAt: string };

// 기한 없이 두고 태그로만 비운다. 기한을 주면 이 조회를 쓰는 화면의 재생성 주기가 그 값으로 줄어든다
const sharedLatest = unstable_cache(
  async (chart: ChartId, scope: string): Promise<StoredSnapshot | null> => {
    const snapshot = await findLatest(chart, scope);
    return snapshot && { ...snapshot, publishedAt: snapshot.publishedAt.toISOString() };
  },
  ["latest-snapshot"],
  { tags: [RANKINGS_TAG] },
);

// 지금 보여 줄 차트. 팬 투표(fan-pick)는 주간 결과뿐이라 주간판 중 최신.
// 홈·랭킹·드라마 화면이 함께 쓰는 값이라 요청을 넘어 공유한다 (화면을 다시 만들 때 DB 를 부르지 않는다).
// 이 함수를 쓴 화면은 RANKINGS_TAG 를 달고 매일 랭킹 뒤 함께 비워진다
export const getLatestSnapshot = cache(async (chart: ChartId, scope = "all"): Promise<Snapshot | null> => {
  const stored = await sharedLatest(chart, scope);
  return stored && { ...stored, publishedAt: new Date(stored.publishedAt) };
});

// 같은 조회를 이 요청 안에서만 쓴다. 글·인물 페이지용: 이 화면들은 1만 쪽이 넘어 RANKINGS_TAG 로 매일 한꺼번에
// 비우면 봇이 다시 열 때마다 DB 를 깨운다. 그래서 태그 없이 글을 내거나 하루 1번 다시 만들 때의 값을 쓴다
export const readLatestSnapshot = cache(
  async (chart: ChartId, scope = "all"): Promise<Snapshot | null> => findLatest(chart, scope),
);

export const getWeeklySnapshot = cache(async (chart: ChartId, period: string): Promise<Snapshot | null> => {
  const row = await prisma.rankingSnapshot.findUnique({ where: { chart_scope_period: { chart, scope: "all", period } } });
  return row ? toSnapshot(row) : null;
});

// 주간 아카이브 링크 (최신 주부터)
export async function listWeeklyPeriods(chart: ChartId, take = 8): Promise<string[]> {
  const rows = await prisma.rankingSnapshot.findMany({
    where: { chart, scope: "all", period: WEEKLY },
    orderBy: { period: "desc" },
    take,
    select: { period: true },
  });
  return rows.map((r) => r.period);
}

// 데이터셋 temporalCoverage 의 시작 (가장 오래된 매일판)
export const getFirstPeriod = cache(async (chart: ChartId): Promise<string | null> => {
  const row = await prisma.rankingSnapshot.findFirst({
    where: { chart, scope: "all", period: chart === "fan-pick" ? WEEKLY : DAILY },
    orderBy: { period: "asc" },
    select: { period: true },
  });
  return row?.period ?? null;
});

function daysAgo(days: number): string {
  return kstDay(new Date(Date.now() - days * 86_400_000));
}

// 최근 N일 매일판 (오래된 날부터). 30일 스파크라인과 공개 JSON(history API)에 쓴다.
// 팬 투표는 매일판이 없어 같은 기간의 주간판을 돌려준다
export async function listHistory(chart: ChartId, scope: string, days: number): Promise<Snapshot[]> {
  const since = daysAgo(days - 1);
  const rows = await prisma.rankingSnapshot.findMany({
    where:
      chart === "fan-pick"
        ? { chart, scope, period: WEEKLY }
        : { chart, scope, AND: [{ period: DAILY }, { period: { gte: since } }] },
    orderBy: { period: "asc" },
  });
  const snapshots = rows.map(toSnapshot);
  return chart === "fan-pick" ? snapshots.slice(-Math.max(1, Math.ceil(days / 7))) : snapshots;
}

export interface RankEntity {
  id: string;
  type: string;
  slug: string | null;
  photo: EntityPhoto | null;
}

// 순위표의 Entity.id 로 사진·slug 를 한 번에
export async function getEntities(ids: string[]): Promise<Map<string, RankEntity>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.entity.findMany({
    where: { id: { in: [...new Set(ids)] } },
    select: { id: true, type: true, slug: true, image: true, imageMeta: true },
  });
  return new Map(rows.map((r) => [r.id, { id: r.id, type: r.type, slug: r.slug, photo: entityPhoto(r) }]));
}

// 오늘(KST) 인물별 응원 수. 점수에는 섞지 않고 '오늘 팬 응원'으로 따로 보인다
export async function todayCheers(ids: string[], day = kstDay()): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const rows = await prisma.cheerVote.groupBy({
    by: ["entityId"],
    where: { day, entityId: { in: ids } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.entityId, r._count._all]));
}

// 응원 직후 버튼에 보일 숫자: 오늘 이 인물 응원 수와 오늘 응원 순위
export async function cheerStanding(entityId: string, day = kstDay()): Promise<{ todayCount: number; todayRank: number }> {
  const rows = await prisma.cheerVote.groupBy({ by: ["entityId"], where: { day }, _count: { _all: true } });
  const todayCount = rows.find((r) => r.entityId === entityId)?._count._all ?? 0;
  const todayRank = 1 + rows.filter((r) => r._count._all > todayCount).length;
  return { todayCount, todayRank };
}

type Names = RankingItem["names"];

// 화면 언어로 부르는 이름. 위키데이터에 그 언어 이름이 없으면 영어 → 한국어 순으로.
// 간체(zh-CN)는 따로 저장하지 않아 번체 이름을 쓴다 (한자 이름은 그대로 읽힌다)
export function displayName(names: Names, locale: string, fallback = ""): string {
  const local = locale === "ja" ? names.ja : locale.startsWith("zh") ? names.zhHant : locale === "ko" ? names.ko : null;
  return local || names.en || names.ko || names.ja || names.zhHant || fallback;
}

// 두 번째 줄 이름: 한국어 이름 (한국어 화면에서는 영어 이름). 첫 줄과 같으면 없다
export function secondaryName(names: Names, locale: string): string | null {
  const main = displayName(names, locale);
  const sub = locale === "ko" ? names.en : names.ko;
  return sub && sub.toLowerCase() !== main.toLowerCase() ? sub : null;
}

// 점수 0~100 을 소수 한 자리로 (프랑스어·러시아어는 87,4)
export function formatScore(score: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
}

// 'YYYY-Www' 주의 월요일 'YYYY-MM-DD' (1월 4일은 늘 그해 1주에 들어 있다)
export function weekStart(period: string): string {
  const [year, week] = period.split("-w").map(Number) as [number, number];
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * 86_400_000);
  monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  return monday.toISOString().slice(0, 10);
}

export function weekEnd(period: string): string {
  const start = new Date(`${weekStart(period)}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + 6);
  return start.toISOString().slice(0, 10);
}

// <time datetime> 에 넣을 값: 매일판은 날짜, 주간판은 ISO 주 '2026-W43'
export function periodDateTime(period: string): string {
  return isWeekPeriod(period) ? period.toUpperCase() : period;
}

// 화면 날짜: 'October 16, 2026' / 주간판은 일정 화면과 같은 기간 모양 'Oct 19 – 25' (올해가 아니면 연도까지)
export function periodLabel(period: string, locale: string): string {
  if (isWeekPeriod(period)) return formatRange(locale, weekStart(period), weekEnd(period), "short");
  return new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric" }).format(
    kst(period),
  );
}

// 펼친 줄의 출처 숫자 (RankingItem.metrics 는 EntityMetric source 별 7일 합)
export function metric(item: RankingItem, key: string): number | null {
  const value = item.metrics?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// 위키백과 7일 조회 상위 언어 [{ lang, views }]
export function topWikiLangs(item: RankingItem, take = 3): { lang: WikiLang; views: number }[] {
  return WIKI_LANGS.map((lang) => ({ lang, views: metric(item, `wiki:${lang}`) ?? 0 }))
    .filter((w) => w.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, take);
}

// 30일 점수 선: 그날 순위표에 없으면 null (선이 끊긴다)
export function scoreSeries(history: Snapshot[], entityId: string): (number | null)[] {
  return history.map((s) => s.items.find((i) => i.entityId === entityId)?.score ?? null);
}

// 펼친 줄의 '최신 글': 글 entities JSON 의 영어 이름(name) 또는 한국어 이름(koreanName)이 같은 가장 최근 글
export async function latestArticles(
  locale: string,
  items: Pick<RankingItem, "entityId" | "names">[],
): Promise<Map<string, { slug: string; title: string }>> {
  const en = [...new Set(items.map((i) => i.names.en).filter((n): n is string => !!n))];
  const ko = [...new Set(items.map((i) => i.names.ko).filter((n): n is string => !!n))];
  if (en.length + ko.length === 0) return new Map();
  const rows = await prisma.translation.findMany({
    where: {
      locale,
      article: {
        status: "PUBLISHED",
        OR: [
          ...en.map((name) => ({ entities: { array_contains: [{ name }] } })),
          ...ko.map((koreanName) => ({ entities: { array_contains: [{ koreanName }] } })),
        ],
      },
    },
    orderBy: { article: { publishedAt: "desc" } },
    take: 80,
    select: { slug: true, title: true, article: { select: { entities: true } } },
  });
  const found = new Map<string, { slug: string; title: string }>();
  for (const item of items) {
    const row = rows.find((r) =>
      (Array.isArray(r.article.entities) ? r.article.entities : []).some((e) => {
        const ent = e as { name?: string; koreanName?: string } | null;
        return (!!item.names.en && ent?.name === item.names.en) || (!!item.names.ko && ent?.koreanName === item.names.ko);
      }),
    );
    if (row) found.set(item.entityId, { slug: row.slug, title: row.title });
  }
  return found;
}

// 이 인물이 나오는 다가오는 일정 (가까운 날부터). 일정 파일(core UPCOMING)에서 이름으로 찾는다 (출연·발매 명단 → 일정 키워드)
export function eventsFor(names: Pick<Names, "en" | "ko">, now = new Date()): EventWithView[] {
  const list = [names.en, names.ko].filter((n): n is string => !!n);
  if (list.length === 0) return [];
  const same = (act: string) => list.some((n) => n.toLowerCase() === act.toLowerCase());
  return listUpcoming(now).filter(
    (e) =>
      e.releases?.some((r) => same(r.act)) ||
      e.days?.some((d) => d.acts.some(same)) ||
      e.lineup?.some(same) ||
      eventMatches(e, list.join(" ")),
  );
}

// 펼친 줄의 '다음 일정'
export function nextEventFor(names: Names, now = new Date()): EventWithView | undefined {
  return eventsFor(names, now)[0];
}
