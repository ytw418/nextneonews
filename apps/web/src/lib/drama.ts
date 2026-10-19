import type { Locale } from "@kmedia/core";

import type { WatchPlatform } from "@/data/drama/types";
import type { Region } from "@/data/types";
import type { ItemTotals } from "@/lib/item-votes";

import { MIN_VOTES_FOR_SUMMARY } from "./vote-rules";

// 드라마 가이드(/drama) 화면의 계산: 시청 지역 판정, '지금 화제' 섞기, 별점 요약, 장르 칩 순서.
// 데이터는 읽지 않는다 (카탈로그는 data/drama 로더, 집계는 lib/item-votes). 그래서 vitest 로 바로 돈다

// 플랫폼 이름은 상표라 번역하지 않는다
export const PLATFORM_NAME: Record<WatchPlatform, string> = {
  netflix: "Netflix",
  viki: "Viki",
  disney: "Disney+",
  prime: "Prime Video",
  viu: "Viu",
  iqiyi: "iQIYI",
  wavve: "Wavve",
  tving: "TVING",
};

// 언어별 독자가 사는 곳 (lib/affiliate.ts 의 제휴 지역 표와 같은 기준). 한국어·러시아어 독자는 카탈로그 지역 목록에 없다
const READER_REGIONS: Record<Locale, readonly Region[]> = {
  en: ["us", "sg", "my", "ph"],
  ja: ["jp"],
  "zh-TW": ["tw", "hk"],
  "zh-CN": ["sg", "my"],
  ko: [],
  vi: ["vn"],
  id: ["id"],
  fr: ["fr"],
  ru: [],
};

export type WatchAvailability =
  | { state: "everywhere" }
  | { state: "confirmed"; regions: Region[] } // 공식 자료에 적힌 지역 중 이 언어 독자 지역
  | { state: "unconfirmed" }; // 지역 자료가 없거나 독자 지역과 겹치지 않음 → '나라마다 다름 · 확인 전'

// '여기서 볼 수 있다' 는 공식 자료(regions)가 이 언어 독자 지역을 적었을 때만 말한다. 나머지는 확인 전으로 둔다
export function watchAvailability(locale: Locale, regions: readonly Region[] | undefined): WatchAvailability {
  if (!regions || regions.length === 0) return { state: "unconfirmed" };
  if (regions.includes("global")) return { state: "everywhere" };
  const mine = READER_REGIONS[locale];
  const overlap = regions.filter((r) => mine.includes(r));
  return overlap.length > 0 ? { state: "confirmed", regions: overlap } : { state: "unconfirmed" };
}

// '지금 화제': 랭킹 상위와 편집 추천을 번갈아(랭킹이 먼저) n 개. 같은 작품(key)은 한 번만.
// 랭킹이 비면 편집 추천만, 편집 추천이 모자라면 랭킹으로 채운다
export function mixTrending<T extends { key: string }>(ranked: readonly T[], curated: readonly T[], n: number): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  // queue 의 from 부터 처음 보는 작품 하나를 넣고 다음 자리를 돌려준다
  const pull = (queue: readonly T[], from: number): number => {
    let i = from;
    while (i < queue.length) {
      const item = queue[i]!;
      i += 1;
      if (!seen.has(item.key)) {
        seen.add(item.key);
        out.push(item);
        break;
      }
    }
    return i;
  };
  let r = 0;
  let c = 0;
  while (out.length < n && (r < ranked.length || c < curated.length)) {
    r = pull(ranked, r);
    if (out.length < n) c = pull(curated, c);
  }
  return out;
}

// 평균을 크게 보이는 최소 평가 수. 그보다 적으면 '평가 n개' 만 (한두 표의 5.0 이 과장돼 보여서. 구조화 데이터 별점 기준과 같다)
export const MIN_RATINGS_FOR_AVERAGE = MIN_VOTES_FOR_SUMMARY;

export interface StarSummary {
  average: number; // 1~5, 표가 없으면 0
  count: number;
  showAverage: boolean;
}

export function starSummary({ totals, total }: ItemTotals): StarSummary {
  const sum = [1, 2, 3, 4, 5].reduce((acc, star) => acc + star * (totals[String(star)] ?? 0), 0);
  return { average: total > 0 ? sum / total : 0, count: total, showAverage: total >= MIN_RATINGS_FOR_AVERAGE };
}

// 별점 평균 4.6 (프랑스어·러시아어는 4,6)
export function formatAverage(average: number, locale: string): string {
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(average);
}

// 장르 칩 순서: 많이 쓰인 장르부터 (같으면 처음 나온 순서)
export function genreOrder(dramas: readonly { genres: readonly string[] }[]): string[] {
  const count = new Map<string, number>();
  for (const d of dramas) for (const g of d.genres) count.set(g, (count.get(g) ?? 0) + 1);
  return [...count.keys()].toSorted((a, b) => count.get(b)! - count.get(a)!);
}
