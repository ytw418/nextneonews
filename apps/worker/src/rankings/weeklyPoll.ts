import * as OpenCC from "opencc-js";

import {
  CHARTS,
  NOT_ARTISTS,
  isoWeekKey,
  kstDay,
  type Locale,
  LOCALES,
  type RankingItem,
  type RankingScope,
  UPCOMING,
  WIKI_BY_LOCALE,
} from "@kmedia/core";
import { type Entity, type Prisma, prisma } from "@kmedia/db";

import { findEntities } from "../entities/match";
import { log } from "../log";
import { assignSlugs } from "./entityMeta";
import { addDays, daysEnding, kstStart } from "./metrics";
import { withPrevRank } from "./score";

// 주간 팬 투표 (로그인 없음). 월요일 00시 KST 에 이번 주 투표를 열고 지난주 투표를 닫아 결과를 fan-pick 랭킹으로 남긴다.
// 질문은 9개 언어 고정 문구, 보기는 인물 이름이라 AI 를 쓰지 않는다
const toCN = OpenCC.Converter({ from: "tw", to: "cn" });

const KPOP_TYPES: readonly string[] = CHARTS.kpop.types;
const OPTION_IDS = ["a", "b", "c", "d", "e", "f"];
const MIN_OPTIONS = 3;
// 언어별 결과는 그 언어 표가 이만큼 모였을 때만 따로 남긴다
const LANG_MIN_VOTES = 30;
const FAN_PICK_METHOD = "votes-v1";

// 이번 주 컴백한 아티스트가 3명 이상이면 컴백 질문, 아니면 응원 질문 (보기를 랭킹으로 채운 경우)
const QUESTIONS: Record<"comeback" | "pick", Record<Locale, string>> = {
  comeback: {
    en: "Who had the best comeback this week?",
    ja: "今週いちばん良かったカムバックは？",
    "zh-TW": "本週最強回歸是誰？",
    "zh-CN": "本周最强回归是谁？",
    ko: "이번 주 최고의 컴백은?",
    vi: "Màn comeback hay nhất tuần này là của ai?",
    id: "Siapa yang comeback terbaik minggu ini?",
    fr: "Qui a fait le meilleur comeback cette semaine ?",
    ru: "Чей камбэк на этой неделе лучший?",
  },
  pick: {
    en: "Who are you cheering for this week?",
    ja: "今週あなたが応援するのは？",
    "zh-TW": "本週你最支持誰？",
    "zh-CN": "本周你最支持谁？",
    ko: "이번 주 내가 응원하는 아티스트는?",
    vi: "Tuần này bạn cổ vũ ai?",
    id: "Minggu ini kamu dukung siapa?",
    fr: "Qui soutenez-vous cette semaine ?",
    ru: "За кого вы болеете на этой неделе?",
  },
};

// 언어별 보기 이름: en·ja·zh-TW·ko 는 사전 표기, zh-CN 은 번체를 간체로, vi·id·fr·ru 는 영문 이름
function nameFor(e: Pick<Entity, "id" | "en" | "ko" | "ja" | "zhHant">, locale: Locale): string {
  const fallback = e.en ?? e.ko ?? e.id;
  if (locale === "ko") return e.ko ?? fallback;
  if (locale === "ja") return e.ja ?? fallback;
  if (locale === "zh-TW") return e.zhHant ?? fallback;
  if (locale === "zh-CN") return e.zhHant ? toCN(e.zhHant) : fallback;
  return fallback;
}

// KST 날짜가 속한 주의 월요일
function mondayOf(day: string): string {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay() || 7;
  return addDays(day, 1 - weekday);
}

// 이번 주(월~일 KST)에 컴백하는 아티스트를 인물 사전에 연결한다 (core UPCOMING).
// 이름이 대소문자만 다른 것("ILLIT" ↔ 사전 "Illit")을 먼저 찾고, 없으면 기사 이름 찾기(findEntities)로 찾는다
async function comebackArtists(days: string[]): Promise<Entity[]> {
  const acts = UPCOMING.filter((e) => e.kind === "comeback").flatMap((e) =>
    (e.releases ?? []).filter((r) => days.includes(r.date ?? e.start)).map((r) => r.act),
  );
  const found: Entity[] = [];
  for (const act of acts) {
    const same = { equals: act, mode: "insensitive" } as const;
    const exact = await prisma.entity.findFirst({
      where: { type: { in: [...KPOP_TYPES] }, OR: [{ en: same }, { ko: same }] },
      orderBy: [{ sitelinks: "desc" }, { id: "asc" }],
    });
    const pick = exact ?? (await findEntities(act)).find((e) => KPOP_TYPES.includes(e.type));
    if (pick && !NOT_ARTISTS.includes(pick.id) && !found.some((f) => f.id === pick.id)) found.push(pick);
  }
  return found;
}

// 최신 K-pop 차트 상위
async function kpopTop(take: number): Promise<string[]> {
  const latest = await prisma.rankingSnapshot.findFirst({
    where: { chart: "kpop", scope: "all" },
    orderBy: { publishedAt: "desc" },
    select: { items: true },
  });
  return ((latest?.items as unknown as RankingItem[] | null) ?? []).slice(0, take).map((i) => i.entityId);
}

async function openWeeklyPoll(key: string, monday: string): Promise<boolean> {
  const comebacks = (await comebackArtists(daysEnding(addDays(monday, 6), 7))).slice(0, OPTION_IDS.length);
  let entities = comebacks;
  if (comebacks.length < MIN_OPTIONS) {
    const ids = [...comebacks.map((e) => e.id), ...(await kpopTop(OPTION_IDS.length))];
    const unique = [...new Set(ids)].slice(0, OPTION_IDS.length);
    const byId = new Map((await prisma.entity.findMany({ where: { id: { in: unique } } })).map((e) => [e.id, e]));
    entities = unique.map((id) => byId.get(id)).filter((e): e is Entity => Boolean(e));
  }
  if (entities.length < MIN_OPTIONS) {
    log.warn("weekly-poll: not enough options (no comebacks this week and no kpop snapshot yet)", { key });
    return false;
  }

  const question = QUESTIONS[comebacks.length >= MIN_OPTIONS ? "comeback" : "pick"];
  const labels = Object.fromEntries(
    LOCALES.map((locale) => [locale, { question: question[locale], options: entities.map((e) => nameFor(e, locale)) }]),
  );
  await prisma.poll.create({
    data: {
      kind: "weekly",
      key,
      optionIds: OPTION_IDS.slice(0, entities.length),
      entityIds: entities.map((e) => e.id),
      labels,
      // 다음 월요일 00시 KST
      closesAt: kstStart(addDays(monday, 7)),
    },
  });
  await assignSlugs(entities.map((e) => e.id));
  log.info("weekly-poll: opened", { key, options: entities.map((e) => e.en ?? e.ko) });
  return true;
}

// 지난 투표를 닫고 결과를 fan-pick 랭킹(scope all, 표가 30 이상인 언어는 그 언어 scope)으로 남긴다
async function closeWeeklyPoll(poll: { id: string; key: string; optionIds: string[]; entityIds: string[] }) {
  const period = poll.key.replace(/^weekly:/, "");
  const votes = await prisma.pollVote.groupBy({
    by: ["option", "locale"],
    where: { pollId: poll.id },
    _count: { _all: true },
  });
  const tallies = new Map<RankingScope, Map<string, number>>([["all", new Map()]]);
  for (const v of votes) {
    const scopes: RankingScope[] = ["all"];
    const lang = WIKI_BY_LOCALE[v.locale as Locale];
    if (lang) scopes.push(lang);
    for (const scope of scopes) {
      const tally = tallies.get(scope) ?? new Map<string, number>();
      tally.set(v.option, (tally.get(v.option) ?? 0) + v._count._all);
      tallies.set(scope, tally);
    }
  }

  const entities = new Map(
    (await prisma.entity.findMany({ where: { id: { in: poll.entityIds } } })).map((e) => [e.id, e]),
  );
  const saved: string[] = [];
  for (const [scope, tally] of tallies) {
    const total = [...tally.values()].reduce((a, b) => a + b, 0);
    if (total === 0 || (scope !== "all" && total < LANG_MIN_VOTES)) continue;
    const ranked = poll.optionIds
      .map((option, index) => ({ option, index, votes: tally.get(option) ?? 0, entityId: poll.entityIds[index] }))
      .filter((o): o is typeof o & { entityId: string } => Boolean(o.entityId && entities.has(o.entityId)))
      .sort((a, b) => b.votes - a.votes || a.index - b.index)
      .map((o, i) => {
        const e = entities.get(o.entityId)!;
        return {
          rank: i + 1,
          entityId: o.entityId,
          names: { en: e.en, ko: e.ko, ja: e.ja, zhHant: e.zhHant },
          score: Math.round((o.votes / total) * 1000) / 10, // 득표율 %
          kr: 0,
          gl: 0,
          metrics: { votes: o.votes },
        };
      });
    const prev = await prisma.rankingSnapshot.findFirst({
      where: { chart: "fan-pick", scope, period: { not: period } },
      orderBy: { publishedAt: "desc" },
      select: { items: true },
    });
    const items = withPrevRank(ranked, prev ? (prev.items as unknown as RankingItem[]) : null);
    const site = process.env.SITE_URL || "https://hallyu-brief.vercel.app";
    // 발행한 결과는 고치지 않는다 (이미 있으면 그대로 둔다)
    await prisma.rankingSnapshot.upsert({
      where: { chart_scope_period: { chart: "fan-pick", scope, period } },
      create: {
        chart: "fan-pick",
        scope,
        period,
        items: items as unknown as Prisma.InputJsonValue,
        sources: [{ name: "Hallyu Brief weekly fan vote", url: `${site}/en/rankings/fan-pick`, count: total }],
        method: FAN_PICK_METHOD,
      },
      update: {},
    });
    saved.push(`${scope}:${total}`);
  }
  await prisma.poll.update({ where: { id: poll.id }, data: { status: "closed" } });
  log.info("weekly-poll: closed", { key: poll.key, saved });
}

// 이번 주 투표가 없으면 연다 (두 번 돌려도 열린 주간 투표는 하나). 지난주 이전의 열린 투표는 닫는다
export async function ensureWeeklyPoll(now = new Date()): Promise<void> {
  const day = kstDay(now);
  const key = `weekly:${isoWeekKey(now)}`;
  const open = await prisma.poll.findMany({
    where: { kind: "weekly", status: "open" },
    select: { id: true, key: true, optionIds: true, entityIds: true },
  });
  for (const poll of open) {
    if (poll.key && poll.key < key) await closeWeeklyPoll({ ...poll, key: poll.key });
  }
  if (await prisma.poll.findUnique({ where: { key }, select: { id: true } })) {
    log.info("weekly-poll: already open", { key });
    return;
  }
  await openWeeklyPoll(key, mondayOf(day));
}
