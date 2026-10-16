import { CHARTS, type ChartKey, kstDay, WIKI_LANGS, type WikiLang } from "@kmedia/core";
import { Prisma, prisma } from "@kmedia/db";

import { assertRobotsAllowed } from "../collectors/robots";
import { log } from "../log";
import { addDays, chartCandidates, chunk, dayDate, KR_SIGNAL_SOURCES, refreshKrMetrics } from "./metrics";

// 세계 관심 재료: 위키백과 언어별 하루 조회 수 (Wikimedia Analytics API, CC0) → EntityMetric('wiki:{lang}')
// 위키미디어는 연락 가능한 User-Agent 를 요구한다
// https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/documentation/access-policy.html
const userAgent = () => `HallyuBriefBot/1.0 (+${process.env.SITE_URL || "https://hallyu-brief.vercel.app"}/en/about#bot)`;

const WIKIDATA_API = "https://www.wikidata.org/w/api.php";
const PAGEVIEWS = "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article";
const TITLES_MAX_AGE_DAYS = 30;
const BACKFILL_DAYS = 90;
const DAILY_DAYS = 3;

// 로그인 없는 봇은 분당 200건, 동시 3건까지다 (https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits).
// 후보 전부(약 4천 건)를 받으면 20분이 걸려서, 평소에는 7분 안에서 중요한 것부터 받는다:
// 최근 7일 국내 신호가 많은 인물(순위에 들 수 있는 인물) → 오래 못 받은 것. 못 받은 날은 다음 실행이 이어 받는다
const CONCURRENCY = 3;
const GAP_MS = 320;
const DAILY_MINUTES = 7;

// Entity.wikiTitles: 언어별 문서 제목 + 받은 날(at). 문서가 없는 언어는 키가 없다
type WikiTitles = Partial<Record<WikiLang, string>> & { at?: string };

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 요청 사이를 GAP_MS 씩 띄운다 (동시에 여러 작업자가 불러도 순서대로 자리를 잡는다)
let nextSlot = 0;
async function paced(): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot);
  nextSlot = slot + GAP_MS;
  if (slot > now) await sleep(slot - now);
}

// 429 면 Retry-After 만큼 기다렸다 다시 한다 (최대 3번)
async function wikiFetch(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await paced();
    const res = await fetch(url, {
      headers: { "user-agent": userAgent(), accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (!res || res.status !== 429) return res;
    const seconds = Number(res.headers.get("retry-after")) || 10;
    log.warn("wiki: rate limited, waiting", { seconds });
    nextSlot = Math.max(nextSlot, Date.now() + seconds * 1000);
  }
  return null;
}

// 위키데이터 sitelinks 로 언어별 정확한 문서 제목을 받는다 (제목을 이름으로 짐작하면 동명 문서가 걸린다).
// 위키미디어 Action API(/w/api.php)는 robots.txt 가 크롤러에게 막아 둔 경로지만, 봇이 쓰라고 연 공식 API 라
// API 규칙(연락 가능한 UA·적은 요청·429 대기)을 따른다 — entities/build.ts·images.ts 와 같다
async function fetchTitles(ids: string[], day: string): Promise<Map<string, WikiTitles>> {
  const titles = new Map<string, WikiTitles>();
  for (const part of chunk(ids, 50)) {
    const params = new URLSearchParams({
      action: "wbgetentities",
      ids: part.join("|"),
      props: "sitelinks",
      sitefilter: WIKI_LANGS.map((lang) => `${lang}wiki`).join("|"),
      format: "json",
    });
    const res = await wikiFetch(`${WIKIDATA_API}?${params}`);
    if (!res?.ok) {
      log.warn("wiki: wikidata request failed", { status: res?.status });
      continue;
    }
    const data = (await res.json()) as {
      entities?: Record<string, { redirects?: { from: string }; sitelinks?: Record<string, { title: string }> }>;
    };
    for (const [key, entity] of Object.entries(data.entities ?? {})) {
      const t: WikiTitles = { at: day };
      for (const lang of WIKI_LANGS) {
        const title = entity.sitelinks?.[`${lang}wiki`]?.title;
        if (title) t[lang] = title;
      }
      // 문서가 하나도 없어도 받은 날을 남겨 30일 동안 다시 묻지 않는다
      titles.set(entity.redirects?.from ?? key, t);
    }
  }
  return titles;
}

// 조회 수를 받을 인물: 세 차트의 후보 + 인물 페이지가 있는 인물(언어별 관심 막대)
async function targets(day: string) {
  const ids = new Set<string>();
  for (const chart of Object.keys(CHARTS) as ChartKey[]) {
    for (const e of await chartCandidates(chart, day)) ids.add(e.id);
  }
  for (const e of await prisma.entity.findMany({ where: { slug: { not: null } }, select: { id: true } })) ids.add(e.id);
  return prisma.entity.findMany({
    where: { id: { in: [...ids] } },
    select: { id: true, wikiTitles: true, sitelinks: true },
  });
}

const ymd = (day: string) => day.replaceAll("-", "");

async function saveViews(rows: Prisma.Sql[]): Promise<void> {
  for (const part of chunk(rows, 1000)) {
    await prisma.$executeRaw`
      INSERT INTO "EntityMetric" ("entityId", date, source, value) VALUES ${Prisma.join(part)}
      ON CONFLICT ("entityId", date, source) DO UPDATE SET value = EXCLUDED.value`;
  }
}

interface Job {
  entityId: string;
  lang: WikiLang;
  title: string;
  start: string;
  kr: number; // 최근 7일 국내 신호 줄 수 (많을수록 먼저)
  last: string; // 이 언어 조회 수를 마지막으로 저장한 날 ('' = 없음)
  sitelinks: number;
}

// 1. 제목: wikiTitles 가 없거나 30일 지난 인물만 다시 받는다
// 2. 조회 수: 마지막으로 저장한 다음 날부터 (최소 최근 3일), 기록이 없으면 90일. 요청 수는 기간과 상관없이 1건이다.
//    --backfill 이면 전부 90일을 시간 제한 없이 받는다 (첫 백필은 로컬에서 한 번)
export async function syncWiki({ backfill }: { backfill: boolean }): Promise<void> {
  const startedAt = Date.now();
  const day = kstDay();
  // 오늘 국내 신호에 새로 나온 인물도 후보가 되도록 국내 숫자를 먼저 맞춘다
  await refreshKrMetrics(day);
  const entities = await targets(day);

  const staleBefore = addDays(day, -TITLES_MAX_AGE_DAYS);
  const stale = entities.filter((e) => ((e.wikiTitles as WikiTitles | null)?.at ?? "") < staleBefore);
  const fresh = await fetchTitles(stale.map((e) => e.id), day);
  for (const part of chunk([...fresh], 500)) {
    await prisma.$executeRaw`
      UPDATE "Entity" AS e SET "wikiTitles" = v.titles::jsonb
      FROM (VALUES ${Prisma.join(part.map(([id, t]) => Prisma.sql`(${id}, ${JSON.stringify(t)})`))}) AS v(id, titles)
      WHERE e.id = v.id`;
  }

  // 위키미디어 집계는 UTC 하루 단위이고, 어제(UTC)까지 나와 있다
  const end = addDays(new Date().toISOString().slice(0, 10), -1);
  const oldest = addDays(end, 1 - BACKFILL_DAYS);
  const lastRows = await prisma.entityMetric.groupBy({
    by: ["entityId", "source"],
    where: { source: { startsWith: "wiki:" }, date: { gte: dayDate(oldest) } },
    _max: { date: true },
  });
  const lastDay = new Map(lastRows.map((r) => [`${r.entityId}:${r.source}`, r._max.date!.toISOString().slice(0, 10)]));
  const krRows = await prisma.entityMetric.groupBy({
    by: ["entityId"],
    where: { source: { in: KR_SIGNAL_SOURCES }, date: { gte: dayDate(addDays(day, -6)) } },
    _count: { _all: true },
  });
  const krCount = new Map(krRows.map((r) => [r.entityId, r._count._all]));

  const jobs: Job[] = entities.flatMap((e) => {
    const t = fresh.get(e.id) ?? (e.wikiTitles as WikiTitles | null) ?? {};
    return WIKI_LANGS.filter((lang) => t[lang]).flatMap((lang) => {
      const last = backfill ? "" : (lastDay.get(`${e.id}:wiki:${lang}`) ?? "");
      // 같은 날 두 번 돌리면 이미 받은 것은 건너뛴다
      if (last >= end) return [];
      // 빠진 날을 이어 받되 최근 3일은 늘 다시 받는다 (늦게 들어온 집계)
      const recent = addDays(end, 1 - DAILY_DAYS);
      const start = !last ? oldest : addDays(last, 1) < recent ? addDays(last, 1) : recent;
      const kr = krCount.get(e.id) ?? 0;
      return [{ entityId: e.id, lang, title: t[lang]!, start, kr, last, sitelinks: e.sitelinks }];
    });
  });
  // 순위에 들 수 있는 인물(국내 신호 많은 순) → 오래 못 받은 것(처음 받는 것 먼저) → 인지도 높은 순
  jobs.sort(
    (a, b) =>
      Number(b.kr > 0) - Number(a.kr > 0) ||
      b.kr - a.kr ||
      a.last.localeCompare(b.last) ||
      b.sitelinks - a.sitelinks ||
      a.entityId.localeCompare(b.entityId) ||
      a.lang.localeCompare(b.lang),
  );

  const deadline = backfill ? Infinity : startedAt + DAILY_MINUTES * 60_000;
  let buffer: Prisma.Sql[] = [];
  let saved = 0;
  let done = 0;
  let missing = 0;
  let failed = 0;
  const flush = async () => {
    const part = buffer;
    buffer = [];
    saved += part.length;
    await saveViews(part);
  };

  let next = 0;
  const worker = async () => {
    while (next < jobs.length && Date.now() < deadline) {
      const job = jobs[next++]!;
      const article = encodeURIComponent(job.title.replaceAll(" ", "_"));
      const url = `${PAGEVIEWS}/${job.lang}.wikipedia.org/all-access/user/${article}/daily/${ymd(job.start)}/${ymd(end)}`;
      await assertRobotsAllowed(url, userAgent());
      const res = await wikiFetch(url);
      done += 1;
      // 404 = 그 기간 조회 기록이 없다 (새 문서·조회 0). 건너뛴다
      if (res?.status === 404) {
        missing += 1;
        continue;
      }
      if (!res?.ok) {
        failed += 1;
        continue;
      }
      const data = (await res.json()) as { items?: { timestamp: string; views: number }[] };
      for (const item of data.items ?? []) {
        const date = `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`;
        buffer.push(Prisma.sql`(${job.entityId}, ${date}::date, ${`wiki:${job.lang}`}, ${item.views})`);
      }
      if (buffer.length >= 5000) await flush();
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await flush();

  log.info("wiki-sync: done", {
    entities: entities.length,
    titlesFetched: fresh.size,
    requests: done,
    left: jobs.length - done, // 시간 제한으로 다음 실행에 넘긴 것
    rows: saved,
    missing,
    failed,
    end,
    minutes: Math.round((Date.now() - startedAt) / 6000) / 10,
  });
}
