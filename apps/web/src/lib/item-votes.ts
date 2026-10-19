import { cache } from "react";
import { z } from "zod";

import { isLocale } from "@kmedia/core";
import { prisma } from "@kmedia/db";

import { CATALOG_SLUG } from "../data/sections";
import { clientIp, ipHash } from "./comments";
import { country, isBot, rateLimited, voterHash } from "./voter";

// 로그인 없는 항목 평가 (뷰티 '써 봤어요?'·시술 관심 투표·드라마 별점) 서버 쪽. 표는 ItemVote 한 테이블에 모은다.
// 화면 컴포넌트(components/ItemVote.tsx)는 여기 타입만 가져간다 (import type).
// 테이블이 없거나(미리보기 배포·마이그레이션 전) DB 에 닿지 않아도 페이지는 0 표로 뜨고, 투표만 503 을 돌려준다

const HOUR_MS = 3_600_000;
// 같은 사람(IP 해시)이 한 시간에 새로 내거나 바꿀 수 있는 표 수
const RATE_MAX = 30;

export const VOTE_KINDS = ["beauty", "clinic", "drama"] as const;
export type VoteKind = (typeof VOTE_KINDS)[number];

// 종류마다 고를 수 있는 답. drama 는 별 1~5
export const CHOICES: Record<VoteKind, readonly string[]> = {
  beauty: ["love", "ok", "meh"],
  clinic: ["curious", "done", "pass"],
  drama: ["1", "2", "3", "4", "5"],
};

// 답을 나눠 볼 기준. 뷰티만 피부 타입 (없으면 facet 을 보낼 수 없다)
export const FACETS: Partial<Record<VoteKind, readonly string[]>> = {
  beauty: ["dry", "oily", "combination", "sensitive", "normal"],
};

// 정적 카탈로그 slug 형식 (proxy.ts matcher 때문에 점은 쓰지 않는다)
const ITEM_ID = CATALOG_SLUG; // 카탈로그 slug 규칙은 data/sections.ts 한 곳

export interface ItemTotals {
  totals: Record<string, number>; // 답 → 표 수
  byFacet: Record<string, Record<string, number>>; // 피부 타입 → 답 → 표 수 (facet 을 보낸 표만)
  total: number;
}

export function isVoteKind(value: unknown): value is VoteKind {
  return typeof value === "string" && (VOTE_KINDS as readonly string[]).includes(value);
}

export function isItemId(value: unknown): value is string {
  return typeof value === "string" && ITEM_ID.test(value);
}

export const ItemVoteInput = z.object({
  choice: z.string().min(1).max(16),
  facet: z.string().min(1).max(16).nullish(),
  locale: z.string().refine(isLocale),
});
export type ItemVoteInput = z.infer<typeof ItemVoteInput>;

// 이 종류에 맞는 답·facet 인지 (형식은 ItemVoteInput 이 먼저 본다)
export function isValidVote(kind: VoteKind, input: Pick<ItemVoteInput, "choice" | "facet">): boolean {
  if (!CHOICES[kind].includes(input.choice)) return false;
  return input.facet == null || (FACETS[kind]?.includes(input.facet) ?? false);
}

// 답마다 0 을 채운 빈 집계 (화면이 키를 따로 확인하지 않아도 되게)
export function emptyTotals(kind: VoteKind): ItemTotals {
  return { totals: Object.fromEntries(CHOICES[kind].map((c) => [c, 0])), byFacet: {}, total: 0 };
}

// 집계 한 칸: 항목·답·피부 타입마다 센 표 수
interface VoteGroup {
  itemId: string;
  choice: string;
  facet: string | null;
  count: number;
}

// (itemId, choice, facet) 별 표 수를 항목별 집계로. 요청한 항목은 표가 없어도 빈 집계로 들어간다
export function tallyVotes(kind: VoteKind, itemIds: readonly string[], groups: readonly VoteGroup[]): Map<string, ItemTotals> {
  const out = new Map(itemIds.map((id) => [id, emptyTotals(kind)]));
  for (const g of groups) {
    const t = out.get(g.itemId);
    if (!t) continue;
    const n = g.count;
    t.totals[g.choice] = (t.totals[g.choice] ?? 0) + n;
    t.total += n;
    if (g.facet) {
      const facet = (t.byFacet[g.facet] ??= {});
      facet[g.choice] = (facet[g.choice] ?? 0) + n;
    }
  }
  return out;
}

// 테이블 없음(P2021)·DB 에 닿지 않음·연결 끊김. pg 어댑터는 연결 실패를 P1001 이 아니라 ECONNREFUSED 같은 소켓 코드로 넘긴다
const DB_UNAVAILABLE = new Set([
  "P2021",
  "P1000",
  "P1001",
  "P1002",
  "P1008",
  "P1017",
  "P2037",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "ETIMEDOUT",
]);
// Postgres 가 돌려준 오류(Prisma 는 P2039·P2010 에 실어 넘긴다) 가운데 DB 자체를 못 쓰는 SQLSTATE:
// 53 자원 부족(Neon 사용량 한도 초과 53000), 57P 관리자 종료·시작 중, 08 연결 오류.
// P2039 를 통째로 목록에 넣지 않는다 — 이름 없는 Postgres 오류를 모두 담는 코드라 진짜 쿼리 버그까지 0표로 숨는다
const UNAVAILABLE_SQLSTATE = /^(53|57P|08)/;

function sqlState(err: object): string | undefined {
  const meta = (err as { meta?: { driverAdapterError?: { cause?: { originalCode?: unknown } } } }).meta;
  const code = meta?.driverAdapterError?.cause?.originalCode;
  return typeof code === "string" ? code : undefined;
}

export function isDbUnavailable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string" && DB_UNAVAILABLE.has(code)) return true;
  return UNAVAILABLE_SQLSTATE.test(sqlState(err) ?? "");
}

// 표 행 → 집계. 같은 IP(ipHash)가 같은 항목에 낸 표는 하루(KST, 처음 낸 날)에 하나만 센다 — 그날 마지막으로 바꾼 표.
// 행(한 기기 한 표 = voterHash IP+UA)은 그대로 두고 세는 것만 묶는다: UA 만 바꿔 새 표를 만들어도 하루 1표,
// 같은 와이파이의 두 사람은 같은 날 내면 1표로, 다른 날 내면 따로 센다. 규칙을 바꾸면 행은 그대로라 되돌릴 수 있다.
// 하루는 한국 날짜(KST = UTC+9, 서머타임 없음)로 자른다 — createdAt 은 UTC 로 저장된다. DISTINCT ON 과 ORDER BY 의 식이
// 글자까지 같아야 해서 9시간은 매개변수가 아니라 SQL 안에 둔다
async function queryTotals(kind: VoteKind, itemIds: readonly string[]): Promise<Map<string, ItemTotals>> {
  if (itemIds.length === 0) return new Map();
  const rows = await prisma.$queryRaw<{ itemId: string; choice: string; facet: string | null; count: number }[]>`
    SELECT "itemId", "choice", "facet", COUNT(*)::int AS "count"
    FROM (
      SELECT DISTINCT ON ("itemId", "ipHash", ("createdAt" + interval '9 hours')::date) "itemId", "choice", "facet"
      FROM "ItemVote"
      WHERE "kind" = ${kind} AND "itemId" = ANY(${[...itemIds]})
      ORDER BY "itemId", "ipHash", ("createdAt" + interval '9 hours')::date, "updatedAt" DESC
    ) AS "counted"
    GROUP BY "itemId", "choice", "facet"`;
  return tallyVotes(kind, itemIds, rows);
}

export interface TotalsRead {
  totals: Map<string, ItemTotals>;
  live: boolean; // false = DB 를 못 써서 0 집계로 대신함 (API 는 이 응답을 캐시하지 않는다)
}

// 항목들의 지금 집계 (쿼리 1회). 테이블이 없거나 DB 가 멈췄으면 0 집계로 대신한다
export async function readItemTotals(kind: VoteKind, itemIds: readonly string[]): Promise<TotalsRead> {
  try {
    return { totals: await queryTotals(kind, itemIds), live: true };
  } catch (err) {
    if (isDbUnavailable(err)) return { totals: tallyVotes(kind, itemIds, []), live: false };
    throw err;
  }
}

// 한 요청 안에서 같은 목록은 한 번만 조회한다 (cache 는 인자를 값이 아니라 참조로 비교해서 목록을 문자열 키로 바꾼다)
const cachedTotals = cache(async (kind: VoteKind, key: string) => (await readItemTotals(kind, key ? key.split(",") : [])).totals);

// 서버 렌더용 집계. 화면 숫자는 클라이언트가 /api/items 로 받는다 (components/ItemVote.tsx) — 페이지를 다시 그리지 않아도 되게.
// 돌려준 Map·객체는 같은 요청의 다른 호출과 공유되니 고치지 않는다
export function getItemTotals(kind: VoteKind, itemIds: readonly string[]): Promise<Map<string, ItemTotals>> {
  const key = [...new Set(itemIds.filter(isItemId))].sort().join(",");
  return cachedTotals(kind, key);
}

// 집계 API(/api/items/…) 성공 응답의 캐시: 숫자는 5분 묵어도 된다 (투표한 사람은 투표 응답으로 바로 새 숫자를 받고,
// 이 기기에 표가 있으면 화면이 주소에 시각을 붙여 캐시를 건너뛴다)
export const TOTALS_CACHE_CONTROL = "public, s-maxage=300, stale-while-revalidate=600";

export type ItemVoteError = "invalid" | "bot" | "notFound" | "tooFast" | "unavailable";

export type ItemVoteOutcome =
  | ({ status: 200; counted: boolean; changed: boolean } & ItemTotals) // counted=false: 같은 답을 다시 보냄 (바뀐 것 없음)
  | { status: 403 | 404 | 429 | 503; error: ItemVoteError };

// 한 기기 한 표 (voterHash scope 'item:{kind}:{itemId}'). 답·facet 을 바꾸면 덮어쓴다.
// 없는 항목 404 는 통합 때 카탈로그의 isKnownItem 으로 연결한다 (그 전에는 형식만 본다)
export async function castItemVote(
  kind: VoteKind,
  itemId: string,
  input: ItemVoteInput,
  headers: Headers,
): Promise<ItemVoteOutcome> {
  const ua = headers.get("user-agent");
  if (isBot(ua)) return { status: 403, error: "bot" };

  const ip = clientIp(headers);
  const hash = ipHash(ip);
  const facet = input.facet ?? null;
  const where = { kind_itemId_voterHash: { kind, itemId, voterHash: voterHash(`item:${kind}:${itemId}`, ip, ua ?? "") } };
  try {
    const before = await prisma.itemVote.findUnique({ where, select: { choice: true, facet: true } });
    const same = before !== null && before.choice === input.choice && before.facet === facet;
    if (!same) {
      // 같은 답을 다시 보내는 것은 세지 않는다 (도배 제한도 실제로 쓰는 표만)
      if (await rateLimited("item", hash, RATE_MAX, HOUR_MS)) return { status: 429, error: "tooFast" };
      const values = { choice: input.choice, facet, ipHash: hash, locale: input.locale, country: country(headers) };
      await prisma.itemVote.upsert({ where, create: { ...where.kind_itemId_voterHash, ...values }, update: values });
    }
    const totals = (await queryTotals(kind, [itemId])).get(itemId) ?? emptyTotals(kind);
    return { status: 200, counted: !same, changed: before !== null && !same, ...totals };
  } catch (err) {
    if (isDbUnavailable(err)) return { status: 503, error: "unavailable" };
    throw err;
  }
}
