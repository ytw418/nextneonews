import type { Locale } from "./locales";
import { kstToday } from "./upcoming";

// 매일 랭킹 (AI 없이 코드로 계산한다). 계산은 apps/worker/src/rankings, 화면은 apps/web/src/app/[locale]/rankings.
// 차트마다 Entity.type 으로 후보를 거른다 — 배우·예능인이 K-pop 차트에 섞이지 않게
export const CHARTS = {
  kpop: { types: ["group", "singer"] },
  // 남녀 아이돌 차트 = K팝 후보를 Entity.gender 로 나눈 것 (혼성 그룹·성별 모름은 kpop 에만)
  boys: { types: ["group", "singer"], gender: "M" },
  girls: { types: ["group", "singer"], gender: "F" },
  actors: { types: ["actor"] },
  kdrama: { types: ["series"] },
} as const satisfies Record<string, { types: readonly string[]; gender?: "M" | "F" }>;

// 위키데이터 직업에 '가수'가 있어도 지금은 기획사 경영인이라 차트·투표에서 뺀다 (이수만·방시혁·양현석)
export const NOT_ARTISTS: readonly string[] = ["Q484165", "Q16082706", "Q490938"];

export type ChartKey = keyof typeof CHARTS;
// fan-pick 은 주간 팬 투표 결과라 Entity.type 으로 거르지 않는다
export type ChartId = ChartKey | "fan-pick";

export function isChartKey(value: string): value is ChartKey {
  return Object.hasOwn(CHARTS, value);
}

// 위키백과 조회수를 모으는 언어 = RankingSnapshot.scope ("all" 은 전체)
export const WIKI_LANGS = ["ko", "en", "ja", "zh", "vi", "id", "fr", "ru"] as const;
export type WikiLang = (typeof WIKI_LANGS)[number];
export type RankingScope = "all" | WikiLang;

// 사이트 언어 → 그 언어권의 관심을 보여 줄 위키 (번체·간체는 같은 zh 위키)
export const WIKI_BY_LOCALE: Record<Locale, WikiLang> = {
  en: "en",
  ja: "ja",
  "zh-TW": "zh",
  "zh-CN": "zh",
  ko: "ko",
  vi: "vi",
  id: "id",
  fr: "fr",
  ru: "ru",
};

// KST 기준 오늘 'YYYY-MM-DD' (매일판 period)
export const kstDay = kstToday;

// KST 날짜가 속한 ISO 주 '2026-w42' (주간 고정판 period, 주간 투표 key). 주는 월요일 00시 KST 에 바뀐다
export function isoWeekKey(date = new Date()): string {
  const d = new Date(`${kstToday(date)}T00:00:00Z`);
  // ISO 주의 연도는 그 주 목요일이 속한 연도다
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const year = d.getUTCFullYear();
  const week = Math.ceil(((d.getTime() - Date.UTC(year, 0, 1)) / 86_400_000 + 1) / 7);
  return `${year}-w${String(week).padStart(2, "0")}`;
}

const DAY_PERIOD = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const WEEK_PERIOD = /^[0-9]{4}-w[0-9]{2}$/;

// 주소에 들어오는 period 가 매일판(YYYY-MM-DD)·주간판(YYYY-Www) 모양인지
export function isPeriodKey(value: string): boolean {
  return DAY_PERIOD.test(value) || WEEK_PERIOD.test(value);
}

// RankingSnapshot.items 한 줄
export interface RankingItem {
  rank: number;
  prevRank: number | null; // 어제(주간판은 지난주) 순위. 새로 들어왔으면 null
  entityId: string;
  names: { en: string | null; ko: string | null; ja: string | null; zhHant: string | null };
  score: number; // 0~100
  kr: number; // 국내 화제 성분 0~100
  gl: number; // 세계 관심 성분 0~100
  metrics: Record<string, number>; // 계산에 쓴 원래 숫자 (EntityMetric source 별 7일 합 등)
}
