import {
  CHARTS,
  type ChartKey,
  isoWeekKey,
  kstDay,
  type RankingItem,
  type RankingScope,
  WIKI_LANGS,
  type WikiLang,
} from "@kmedia/core";
import { type Entity, Prisma, prisma } from "@kmedia/db";

import { log } from "../log";
import { assignSlugs } from "./entityMeta";
import {
  addDays,
  chartCandidates,
  dayDate,
  daysEnding,
  KR_SIGNAL_SOURCES,
  KR_SOURCES,
  kstStart,
  refreshKrMetrics,
} from "./metrics";
import { type Candidate, METHOD, rankChart, rankRising, type SnapshotItem, withPrevRank } from "./score";

// 매일 랭킹 스냅숏 (AI 없음). 차트마다 전체 상위 30 + 위키 8개 언어별 '뜨는' 상위 10.
// 유튜브(API 정책 III.E.4.h)·멜론(robots)·써클차트(TDM 금지)·네이트판(robots)은 쓰지 않는다
const CHART_KEYS = Object.keys(CHARTS) as ChartKey[];

function sources(theqooPosts: number) {
  return [
    { name: "theqoo", url: "https://theqoo.net/hot", count: theqooPosts },
    { name: "Google Trends KR", url: "https://trends.google.com/trending?geo=KR" },
    { name: "Yonhap", url: "https://www.yna.co.kr" },
    { name: "Wikipedia pageviews (Wikimedia, CC0)", url: "https://wikimedia.org/api/rest_v1/" },
  ];
}

const asJson = (value: unknown) => value as Prisma.InputJsonValue;

// 위키 조회 수가 나와 있는 마지막 날 (위키미디어 집계는 하루 늦게 나온다). 7일 창을 여기서 끝낸다
async function latestWikiDay(day: string): Promise<string | null> {
  const latest = await prisma.entityMetric.findFirst({
    where: { source: { startsWith: "wiki:" }, date: { lte: dayDate(day) } },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  return latest ? latest.date.toISOString().slice(0, 10) : null;
}

// (entityId, source) 마다 기간 합·줄 수·마지막 날
function sums(ids: string[], sourceFilter: Prisma.StringFilter, from: string, to: string) {
  return prisma.entityMetric.groupBy({
    by: ["entityId", "source"],
    where: { entityId: { in: ids }, source: sourceFilter, date: { gte: dayDate(from), lte: dayDate(to) } },
    _sum: { value: true },
    _count: { _all: true },
    _max: { date: true },
  });
}

// 위키 조회 수가 이 날보다 오래되면 (시간 제한으로 며칠 못 받았으면) 그 언어 값을 쓰지 않는다.
// 7일 합이 덜 모인 채 들어가 점수·성장률이 낮게 나오지 않게 한다
const WIKI_FRESH_DAYS = 2;

// 후보마다 국내 7일(오늘까지)·위키 7일과 직전 7일(위키가 나온 마지막 날까지) 합을 모은다
async function loadCandidates(entities: Entity[], day: string, wikiEnd: string | null): Promise<Candidate[]> {
  const ids = entities.map((e) => e.id);
  const metrics = new Map<string, Record<string, number>>(ids.map((id) => [id, {}]));
  const krSignals = new Map<string, number>();

  for (const row of await sums(ids, { in: [...KR_SOURCES] }, addDays(day, -6), day)) {
    metrics.get(row.entityId)![row.source] = row._sum.value ?? 0;
    if ((KR_SIGNAL_SOURCES as string[]).includes(row.source)) {
      krSignals.set(row.entityId, (krSignals.get(row.entityId) ?? 0) + row._count._all);
    }
  }
  if (wikiEnd) {
    const wiki = { startsWith: "wiki:" };
    const freshFrom = dayDate(addDays(wikiEnd, -WIKI_FRESH_DAYS));
    const fresh = new Set<string>();
    for (const row of await sums(ids, wiki, addDays(wikiEnd, -6), wikiEnd)) {
      if (!row._max.date || row._max.date < freshFrom) continue;
      fresh.add(`${row.entityId}:${row.source}`);
      metrics.get(row.entityId)![row.source] = row._sum.value ?? 0;
    }
    for (const row of await sums(ids, wiki, addDays(wikiEnd, -13), addDays(wikiEnd, -7))) {
      if (!fresh.has(`${row.entityId}:${row.source}`)) continue;
      metrics.get(row.entityId)![`${row.source}:prev`] = row._sum.value ?? 0;
    }
  }

  return entities.map((e) => {
    const titles = (e.wikiTitles ?? {}) as Partial<Record<WikiLang, string>>;
    return {
      entityId: e.id,
      names: { en: e.en, ko: e.ko, ja: e.ja, zhHant: e.zhHant },
      krSignals: krSignals.get(e.id) ?? 0,
      wikiTitles: WIKI_LANGS.filter((lang) => titles[lang]).length,
      metrics: metrics.get(e.id)!,
    };
  });
}

// 전날 같은 chart·scope 매일판 순위 (실행이 하루 빠졌으면 7일 안의 가장 최근 것)
async function previousItems(chart: string, scope: RankingScope, day: string): Promise<RankingItem[] | null> {
  const prev = await prisma.rankingSnapshot.findFirst({
    where: { chart, scope, period: { in: daysEnding(addDays(day, -1), 7) } },
    orderBy: { period: "desc" },
    select: { items: true },
  });
  return prev ? (prev.items as unknown as RankingItem[]) : null;
}

// 지난 ISO 주의 마지막 매일판을 주간 고정판(YYYY-Www)으로 복사한다. 이미 있으면 건드리지 않는다
// (발행 뒤에는 items 를 고치지 않고 correction 만 쓴다). 월요일 실행이 빠져도 다음 날 채워지도록 매번 확인한다
async function freezeLastWeek(day: string): Promise<number> {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay() || 7;
  const lastMonday = addDays(day, 1 - weekday - 7);
  const period = isoWeekKey(new Date(`${lastMonday}T12:00:00+09:00`));
  const prevPeriod = isoWeekKey(new Date(`${addDays(lastMonday, -7)}T12:00:00+09:00`));

  const dailies = await prisma.rankingSnapshot.findMany({
    where: { chart: { in: CHART_KEYS }, period: { in: daysEnding(addDays(lastMonday, 6), 7) } },
    orderBy: { period: "desc" },
  });
  const frozen = new Set(
    (await prisma.rankingSnapshot.findMany({ where: { period }, select: { chart: true, scope: true } })).map(
      (s) => `${s.chart}:${s.scope}`,
    ),
  );
  let created = 0;
  for (const daily of dailies) {
    const key = `${daily.chart}:${daily.scope}`;
    if (frozen.has(key)) continue;
    frozen.add(key);
    const prevWeek = await prisma.rankingSnapshot.findUnique({
      where: { chart_scope_period: { chart: daily.chart, scope: daily.scope, period: prevPeriod } },
      select: { items: true },
    });
    const items = withPrevRank(
      (daily.items as unknown as SnapshotItem[]).map(({ prevRank: _prev, rising: _rising, ...item }) => item),
      prevWeek ? (prevWeek.items as unknown as RankingItem[]) : null,
    );
    const { chart, scope, sources: dailySources, method } = daily;
    await prisma.rankingSnapshot.create({
      data: { chart, scope, period, items: asJson(items), sources: asJson(dailySources), method },
    });
    created += 1;
  }
  return created;
}

// 오늘(KST) 스냅숏. 같은 날 다시 돌리면 같은 재료로 같은 items 를 덮어쓴다
export async function runRankings(now = new Date()): Promise<void> {
  const day = kstDay(now);
  await refreshKrMetrics(day);
  const wikiEnd = await latestWikiDay(day);
  if (!wikiEnd) log.warn("rankings: no wikipedia pageviews yet (run wiki-sync --backfill first)");

  const theqooPosts = await prisma.signal.count({
    where: { source: "theqoo", lastSeenAt: { gte: kstStart(addDays(day, -6)), lt: kstStart(addDays(day, 1)) } },
  });
  const pending: { chart: ChartKey; scope: RankingScope; items: SnapshotItem[] }[] = [];
  for (const chart of CHART_KEYS) {
    const cands = await loadCandidates(await chartCandidates(chart, day), day, wikiEnd);
    pending.push({ chart, scope: "all", items: rankChart(cands, await previousItems(chart, "all", day)) });
    for (const lang of WIKI_LANGS) {
      pending.push({ chart, scope: lang, items: rankRising(cands, lang, await previousItems(chart, lang, day)) });
    }
  }

  // 화면이 모든 항목을 인물 페이지로 이을 수 있게 slug 부터 채운다
  await assignSlugs(pending.flatMap((p) => p.items.map((i) => i.entityId)));

  const saved: string[] = [];
  for (const { chart, scope, items } of pending) {
    // 재료가 없어 빈 목록이면 남기지 않는다 (화면은 '첫 차트는 05:00 KST' 빈 상태를 보인다)
    if (items.length === 0) continue;
    const data = { items: asJson(items), sources: asJson(sources(theqooPosts)), method: METHOD };
    await prisma.rankingSnapshot.upsert({
      where: { chart_scope_period: { chart, scope, period: day } },
      create: { chart, scope, period: day, ...data },
      update: { ...data, publishedAt: new Date() },
    });
    saved.push(`${chart}:${scope}:${items.length}`);
  }
  const frozen = await freezeLastWeek(day);
  log.info("rankings: done", { day, wikiEnd, saved, frozen });
}
