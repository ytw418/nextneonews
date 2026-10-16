import { CHARTS, type ChartKey } from "@kmedia/core";
import { type Entity, Prisma, prisma } from "@kmedia/db";

import { findEntities } from "../entities/match";
import { log } from "../log";

// 국내 화제 재료: KST 하루마다 수집 신호(Signal)를 인물·작품에 연결해 EntityMetric 으로 합친다 (AI 없음)
export const KR_SOURCES = ["theqoo:posts", "theqoo:views", "theqoo:comments", "trends", "yonhap"] as const;
type KrSource = (typeof KR_SOURCES)[number];
// 신호 한 건마다 한 줄씩 생기는 종류 (더쿠 조회·댓글 줄은 글 줄과 같은 신호라 세지 않는다)
export const KR_SIGNAL_SOURCES: KrSource[] = ["theqoo:posts", "trends", "yonhap"];

// 차트마다 sitelinks(해외 인지도) 상위 몇 개를 기본 후보로 둘지
const SITELINK_CANDIDATES = 150;

// 'YYYY-MM-DD' 날짜 계산 (시간대 없이 날짜만)
export function addDays(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// EntityMetric.date(@db.Date) 에 넣는 값
export function dayDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

// KST 그날 0시 (Signal.lastSeenAt 비교용)
export function kstStart(day: string): Date {
  return new Date(`${day}T00:00:00+09:00`);
}

// day 를 끝으로 하는 n 일 ['…', day]
export function daysEnding(day: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(day, i - n + 1));
}

// 같은 숫자를 여러 번 세지 않게 신호 종류별로 더한다
function add(sums: Map<string, Map<KrSource, number>>, entityId: string, source: KrSource, value: number) {
  const bySource = sums.get(entityId) ?? new Map<KrSource, number>();
  bySource.set(source, (bySource.get(source) ?? 0) + value);
  sums.set(entityId, bySource);
}

interface SignalNumbers {
  views?: number;
  comments?: number;
  likes?: number;
}

// 그 KST 날짜에 마지막으로 보인(lastSeenAt) 신호를 읽어 인물별로 합친다.
// 같은 날을 다시 계산하면 그날 줄을 지우고 새로 쓴다 → 다시 돌려도 결과가 같다
export async function buildKrMetrics(day: string): Promise<number> {
  const signals = await prisma.signal.findMany({
    where: {
      source: { in: ["theqoo", "google-trends", "yonhap"] },
      lastSeenAt: { gte: kstStart(day), lt: kstStart(addDays(day, 1)) },
    },
    select: { source: true, title: true, metrics: true },
    orderBy: { id: "asc" },
  });

  const sums = new Map<string, Map<KrSource, number>>();
  // 구글 트렌드는 같은 날 같은 검색어를 한 번만 센다 (검색어가 날짜를 넘겨 두 줄이 될 수 있다)
  const trendSeen = new Set<string>();
  for (const signal of signals) {
    const entities = await findEntities(signal.title);
    if (entities.length === 0) continue;
    const m = (signal.metrics ?? {}) as SignalNumbers;
    for (const entity of entities) {
      if (signal.source === "theqoo") {
        add(sums, entity.id, "theqoo:posts", 1);
        add(sums, entity.id, "theqoo:views", m.views ?? 0);
        add(sums, entity.id, "theqoo:comments", m.comments ?? 0);
      } else if (signal.source === "google-trends") {
        const keyword = signal.title.split(" · ")[0]!.trim();
        if (trendSeen.has(`${entity.id}:${keyword}`)) continue;
        trendSeen.add(`${entity.id}:${keyword}`);
        add(sums, entity.id, "trends", m.likes ?? 0);
      } else {
        add(sums, entity.id, "yonhap", 1);
      }
    }
  }

  const rows = [...sums].flatMap(([entityId, bySource]) =>
    [...bySource].map(([source, value]) => Prisma.sql`(${entityId}, ${day}::date, ${source}, ${value})`),
  );
  const date = dayDate(day);
  await prisma.$transaction([
    prisma.entityMetric.deleteMany({ where: { date, source: { in: [...KR_SOURCES] } } }),
    ...chunk(rows, 1000).map(
      (part) => prisma.$executeRaw`
        INSERT INTO "EntityMetric" ("entityId", date, source, value) VALUES ${Prisma.join(part)}
        ON CONFLICT ("entityId", date, source) DO UPDATE SET value = EXCLUDED.value`,
    ),
  ]);
  log.info("rankings: korea metrics", { day, signals: signals.length, entities: sums.size });
  return sums.size;
}

// 오늘 신호가 어제 신호의 lastSeenAt 을 오늘로 옮기므로 어제도 함께 다시 계산한다
export async function refreshKrMetrics(day: string): Promise<void> {
  await buildKrMetrics(addDays(day, -1));
  await buildKrMetrics(day);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const parts: T[][] = [];
  for (let i = 0; i < items.length; i += size) parts.push(items.slice(i, i + size));
  return parts;
}

// 차트 후보: 차트 종류(Entity.type)에 맞는 인물·작품 중 sitelinks 상위 150 + 최근 7일 국내 신호에 나온 것.
// 종류로 거르므로 배우·예능인이 K-pop 차트에 들어가지 않는다
export async function chartCandidates(chart: ChartKey, day: string): Promise<Entity[]> {
  const types = [...CHARTS[chart].types];
  const top = await prisma.entity.findMany({
    where: { type: { in: types } },
    orderBy: [{ sitelinks: "desc" }, { id: "asc" }],
    take: SITELINK_CANDIDATES,
  });
  const recent = await prisma.entityMetric.findMany({
    where: { source: { in: [...KR_SOURCES] }, date: { gte: dayDate(addDays(day, -6)), lte: dayDate(day) } },
    distinct: ["entityId"],
    select: { entityId: true },
  });
  const known = new Set(top.map((e) => e.id));
  const extra = await prisma.entity.findMany({
    where: { id: { in: recent.map((r) => r.entityId).filter((id) => !known.has(id)) }, type: { in: types } },
    orderBy: { id: "asc" },
  });
  return [...top, ...extra];
}
