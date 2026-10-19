// 값 import 는 상대 경로로 (vitest 는 @ 별칭을 모른다)
import { type PriceTier, SKIN_TYPES, type SkinType } from "../data/beauty/types";
import type { ItemTotals } from "./item-votes";

// 뷰티 섹션의 계산 (어워드 점수·순위·추천·피부 타입 테스트 채점·표시 규칙). 카탈로그는 읽지 않는다 —
// 서버 페이지가 로더(src/data/beauty)로 읽어 넘기고, 테스트 채점은 클라이언트에서도 같은 함수를 쓴다

// ───────── 이 기기의 피부 타입 (테스트 결과) ─────────
// 개인정보 페이지 STORAGE_KEYS 에 같은 이름이 있다. 평가 칩의 facet 과 '내 타입 집계'에 쓴다
export const SKIN_TYPE_KEY = "hb:skin-type";
// 같은 탭의 다른 칩·문구가 바로 따라 바뀌게 (storage 이벤트는 같은 탭에 오지 않는다)
export const SKIN_TYPE_CHANGED = "hb:skin-type-changed";

export function isSkinType(value: unknown): value is SkinType {
  return typeof value === "string" && (SKIN_TYPES as readonly string[]).includes(value);
}

// 결과 커버·공유 이미지에 찍는 운영 주소 (캡처해 올려도 어디서 했는지 보이게)
export const SHARE_DOMAIN = "unnienote.app";

// 결과 커버의 유령 글자·공유 이미지 문구 (라틴 대문자 — 공유 이미지에 한중일 폰트를 싣지 않는다)
export const SKIN_CODE: Record<SkinType, string> = {
  dry: "DRY",
  oily: "OILY",
  combination: "COMBO",
  sensitive: "SENSITIVE",
  normal: "NORMAL",
};

// ───────── 어워드 점수 (페이지 하단에 같은 식을 적는다) ─────────
// score = 편집 점수 + 25 × (인생템 − 별로) ÷ (전체 표 + 5). 표가 적을 때 한두 표로 순위가 뒤집히지 않게 분모에 5를 더한다
export const VOTE_WEIGHT = 25;
export const VOTE_DAMPING = 5;
// 분류의 표 합계가 이보다 적으면 '어워드' 대신 '에디터 픽' 이라고 부른다 (0표 어워드는 의견에 왕관을 씌운 것)
export const AWARDS_MIN_VOTES = 30;
// 평가 칩에 표 수 대신 % 를 보이는 최소 표 (2표 중 2표 = 100% 같은 과장을 막는다)
export const PERCENT_MIN_VOTES = 10;
// '건성 n%가 인생템' 에 % 를 보이는 최소 표 (그보다 적으면 표 수만)
export const FACET_MIN_VOTES = 5;
// 구조화 데이터 별점·화면의 5점 환산 점수를 내는 최소 표 (jsonld-catalog productLd 와 같은 기준)
export const RATING_MIN_VOTES = 5;

function count(totals: ItemTotals | undefined, choice: string): number {
  return totals?.totals[choice] ?? 0;
}

export function awardScore(editorialScore: number, totals: ItemTotals | undefined): number {
  const love = count(totals, "love");
  const ok = count(totals, "ok");
  const meh = count(totals, "meh");
  return editorialScore + (VOTE_WEIGHT * (love - meh)) / (love + ok + meh + VOTE_DAMPING);
}

export interface Ranked<T> {
  item: T;
  score: number;
  rank: number; // 1부터
}

interface Rankable {
  slug: string;
  editorialScore: number;
  addedAt: string;
}

// 점수 높은 순. 같으면 최근에 넣은 것, 그래도 같으면 slug 순 (빌드마다 순서가 흔들리지 않게)
export function rankAwards<T extends Rankable>(items: readonly T[], totals: ReadonlyMap<string, ItemTotals>): Ranked<T>[] {
  return items
    .map((item) => ({ item, score: awardScore(item.editorialScore, totals.get(item.slug)) }))
    .toSorted(
      (a, b) =>
        b.score - a.score || b.item.addedAt.localeCompare(a.item.addedAt) || a.item.slug.localeCompare(b.item.slug),
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

// 항목들의 표 합계
export function sumVotes(slugs: readonly string[], totals: ReadonlyMap<string, ItemTotals>): number {
  return slugs.reduce((sum, slug) => sum + (totals.get(slug)?.total ?? 0), 0);
}

export function isEditorsPick(votes: number): boolean {
  return votes < AWARDS_MIN_VOTES;
}

// 독자 점수 5점 환산 (인생템 5 · 괜찮음 3 · 별로 1). 표가 적으면 null — 화면과 구조화 데이터가 같은 값을 쓴다
const CHOICE_POINTS: Record<string, number> = { love: 5, ok: 3, meh: 1 };

export function readerRating(totals: ItemTotals | undefined): { value: number; count: number } | null {
  if (!totals || totals.total < RATING_MIN_VOTES) return null;
  const points = Object.entries(CHOICE_POINTS).reduce((sum, [choice, p]) => sum + p * count(totals, choice), 0);
  return { value: Math.round((points / totals.total) * 10) / 10, count: totals.total };
}

// 피부 타입 하나의 '인생템' 표와 전체 표
export function facetLove(totals: ItemTotals | undefined, facet: SkinType): { love: number; total: number } {
  const votes = totals?.byFacet[facet] ?? {};
  const total = Object.values(votes).reduce((sum, n) => sum + n, 0);
  return { love: votes.love ?? 0, total };
}

// 표가 가장 많은 피부 타입 (내 타입을 모를 때 보여 줄 줄). 피부 타입을 단 표가 없으면 null
export function busiestFacet(totals: ItemTotals | undefined): SkinType | null {
  let best: SkinType | null = null;
  let most = 0;
  for (const skin of SKIN_TYPES) {
    const { total } = facetLove(totals, skin);
    if (total > most) {
      best = skin;
      most = total;
    }
  }
  return best;
}

export function percentOf(n: number, total: number): number {
  return total > 0 ? Math.round((n / total) * 100) : 0;
}

// ───────── 추천 ─────────
interface Pickable extends Rankable {
  category: string;
  skinTypes: readonly SkinType[];
}

// 이 피부 타입에 맞는 제품을 점수순으로 n 개. 분류가 겹치지 않게 먼저 한 바퀴 고르고, 모자라면 점수순으로 채운다
// (같은 분류 다섯 개보다 세안부터 선크림까지가 쓸모 있다)
export function picksForSkin<T extends Pickable>(ranked: readonly Ranked<T>[], skin: SkinType, n: number): T[] {
  const first: T[] = [];
  const rest: T[] = [];
  const seen = new Set<string>();
  for (const { item } of ranked) {
    if (!item.skinTypes.includes(skin)) continue;
    (seen.has(item.category) ? rest : first).push(item);
    seen.add(item.category);
  }
  return [...first, ...rest].slice(0, n);
}

// ───────── 피부 타입 테스트 채점 (재미용) ─────────
interface QuizQuestion {
  id: string;
  options: { id: string; weights: Partial<Record<string, number>> }[];
}

// 동점이면 앞쪽: 민감성을 먼저 (순한 제품을 권하는 쪽이 안전하다), 중성은 마지막
export const SKIN_TIE_ORDER: readonly SkinType[] = ["sensitive", "combination", "dry", "oily", "normal"];

// 고른 보기의 가중치를 더해 가장 높은 결과. answers: 문항 id → 보기 id (모르는 id 는 0점)
export function scoreQuiz(questions: readonly QuizQuestion[], answers: Record<string, string>, order: readonly string[]): string {
  const sums = new Map<string, number>(order.map((key) => [key, 0]));
  for (const q of questions) {
    const option = q.options.find((o) => o.id === answers[q.id]);
    for (const [key, weight] of Object.entries(option?.weights ?? {})) {
      sums.set(key, (sums.get(key) ?? 0) + (weight ?? 0));
    }
  }
  return order.reduce((best, key) => ((sums.get(key) ?? 0) > (sums.get(best) ?? 0) ? key : best), order[0]!);
}

// ───────── 표시 ─────────
export function priceSigns(tier: PriceTier): string {
  return "₩".repeat(tier);
}

// 커버 유령 글자: 브랜드 라틴 이니셜 1~2자 (COSRX → C, Beauty of Joseon → BJ, Round Lab → RL)
const GLYPH_SKIP = new Set(["of", "the", "en", "de", "&"]);

export function brandGlyph(brand: string): string {
  const words = brand.split(/\s+/).filter((w) => w && !GLYPH_SKIP.has(w.toLowerCase()));
  const letters = words.slice(0, 2).map((w) => w.match(/[A-Za-z0-9]/)?.[0] ?? "");
  return letters.join("").toUpperCase() || brand.slice(0, 1).toUpperCase();
}

// '10.19 갱신' 의 날짜 (한국 시각, 언어별 월·일 표기)
export function updatedDate(locale: string, at: Date = new Date()): string {
  return new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" }).format(at);
}
