import type { AreaSlug, PlaceKind, PrepKey } from "@/data/travel/types";
import type { AffiliatePartner, AffiliateTarget } from "@/data/types";

// vitest 는 @/ 별칭을 모른다 — 값 import 는 상대 경로로
import { coverGlyph } from "../components/guide/glyph";

// 여행 화면(/travel·동네·명소) 계산과 상수. 서버·클라이언트 어디서나 쓴다 (카탈로그는 import 하지 않는다)

// ───────── 타이포 커버 유령 글자 ─────────
// 규칙은 components/guide/glyph.ts coverGlyph 하나 (DESIGN.md §4-①). 여행 화면이 부르기 쉽게 동네 인자만 받는다
export function areaGlyph(area: AreaSlug, name: string, locale: string): string {
  return coverGlyph({ kind: "place", area, areaName: name, locale });
}

// ───────── '가 봤어요' 도장 진행 ─────────
export interface StampProgress {
  done: number; // 이 동네 명소 중 도장 찍은 수
  total: number;
  percent: number; // 0~100 정수 (진행 막대 폭)
  complete: boolean; // 다 찍었다 (명소가 없으면 false)
}

// visited 는 이 기기의 도장 목록 전체(다른 동네 것도 섞여 있다). 동네 명소 slug 와 겹치는 것만 센다
export function stampProgress(visited: readonly string[], slugs: readonly string[]): StampProgress {
  const mine = new Set(visited);
  const total = slugs.length;
  const done = slugs.filter((slug) => mine.has(slug)).length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: total > 0 && done === total,
  };
}

// ───────── 허브 종류 칩 ─────────
// 칩 순서: 팬이 찾아오는 이유 순(촬영지·아이돌 먼저). 명소가 없는 종류는 칩을 그리지 않는다
const KIND_ORDER: readonly PlaceKind[] = ["filming", "idol", "cafe", "photo", "food", "shop", "landmark"];

export function placeKinds(places: readonly { kind: PlaceKind }[]): PlaceKind[] {
  const present = new Set(places.map((p) => p.kind));
  return KIND_ORDER.filter((kind) => present.has(kind));
}

// ───────── 허브 '촬영지·아이돌 성지' 목록 ─────────
const SPOTLIGHT_KINDS: ReadonlySet<PlaceKind> = new Set(["filming", "idol"]);

// 카탈로그 순서(동네 순)대로 촬영지·아이돌 성지만 n 개
export function spotlightPlaces<T extends { kind: PlaceKind }>(places: readonly T[], n: number): T[] {
  return places.filter((p) => SPOTLIGHT_KINDS.has(p.kind)).slice(0, n);
}

// ───────── 지도 ─────────
// 네이버 지도 검색 (한국에서는 구글 지도의 길찾기가 거의 안 된다). 괄호 안 별칭은 빼야 검색이 한 곳으로 모인다:
// "N서울타워(남산서울타워)" → "N서울타워"
export function naverMapUrl(koName: string): string {
  const query = koName.replace(/\s*[(（][^)）]*[)）]\s*/g, " ").trim() || koName.trim();
  return `https://map.naver.com/p/search/${encodeURIComponent(query)}`;
}

// ───────── 여행 준비 제휴 상자 ─────────
// 대상은 각 파트너의 해당 상품 목록·검색 공식 주소. 추적 링크는 lib/affiliate.ts 가 환경변수로 만든다.
// Klook 은 접속 언어를 스스로 고르고, Creatrip 은 언어별 경로가 있다 (한국어 화면은 없어 영어로)
const CREATRIP_LOCALES = new Set(["ja", "zh-TW", "zh-CN", "vi", "id", "fr", "ru"]);

function creatrip(locale: string, path: string): string {
  return `https://creatrip.com/${CREATRIP_LOCALES.has(locale) ? locale : "en"}${path}`;
}

type PrepUrl = (locale: string) => string;

const PREP_URL: Record<PrepKey, Partial<Record<AffiliatePartner, PrepUrl>>> = {
  esim: {
    klook: () => "https://www.klook.com/wifi-sim-card/?region=31-South+Korea",
    airalo: () => "https://www.airalo.com/south-korea-esim",
  },
  tmoney: { klook: () => "https://www.klook.com/search/result/?query=T-money" },
  airport: { klook: () => "https://www.klook.com/search/result/?query=AREX" },
  stay: { trip: () => "https://www.trip.com/hotels/seoul-hotels-list-274/" },
  tour: {
    klook: () => "https://www.klook.com/destination/c13-seoul/",
    creatrip: (locale) => creatrip(locale, "/spot/list"),
  },
};

export interface PrepRow {
  key: PrepKey;
  partner: AffiliatePartner;
}

// 여행 준비 링크 표는 여기 하나: 허브·동네·명소·생활 글 상자가 같은 파트너·주소를 쓴다 (공항 이동은 Klook — BM-VALIDATION §4).
// 줄 순서 = 화면 순서. 첫 줄은 eSIM (Klook 수수료가 가장 확실하고, 도착 첫날 꼭 필요하다)
export const PREP_ROWS: Record<"hub" | "area" | "article", PrepRow[]> = {
  hub: [
    { key: "esim", partner: "klook" },
    { key: "esim", partner: "airalo" },
    { key: "tmoney", partner: "klook" },
    { key: "airport", partner: "klook" },
    { key: "stay", partner: "trip" },
    { key: "tour", partner: "klook" },
    { key: "tour", partner: "creatrip" },
  ],
  area: [
    { key: "esim", partner: "klook" },
    { key: "airport", partner: "klook" },
    { key: "stay", partner: "trip" },
  ],
  // 생활 글 끝 상자 (lib/ads.ts articlePrepFor 가 분류·언어를 보고 고른다): eSIM → 공항 이동 → 숙소
  article: [
    { key: "esim", partner: "klook" },
    { key: "airport", partner: "klook" },
    { key: "stay", partner: "trip" },
  ],
};

export function prepTarget(key: PrepKey, partner: AffiliatePartner, locale: string): AffiliateTarget {
  const url = PREP_URL[key][partner];
  if (!url) throw new Error(`여행 준비 링크 없음: ${key}/${partner}`);
  return { partner, url: url(locale) };
}

// 명소 페이지 작은 상자 두 줄: eSIM(Klook) + 공항 이동·투어(Creatrip 상품 목록 — 공항 픽업·투어가 함께 있다)
export function placePrepTargets(locale: string): { esim: AffiliateTarget; airportTour: AffiliateTarget } {
  return {
    esim: prepTarget("esim", "klook", locale),
    airportTour: prepTarget("tour", "creatrip", locale),
  };
}

// 줄 → { key, target } (문구는 부르는 쪽이 prep.items[key] 로 붙인다). 생활 글 상자가 쓴다
export function prepTargets(rows: readonly PrepRow[], locale: string): { key: PrepKey; target: AffiliateTarget }[] {
  return rows.map((row) => ({ key: row.key, target: prepTarget(row.key, row.partner, locale) }));
}

export interface PrepBoxItem {
  target: AffiliateTarget;
  label: string;
  sub?: string;
  itemId: string;
}

// AffiliateBox 줄. 같은 준비 항목이 파트너만 바꿔 두 줄이면 설명(sub)은 첫 줄에만 둔다 (같은 문장이 두 번 보이지 않게)
export function prepBoxItems(
  rows: readonly PrepRow[],
  items: Record<PrepKey, { label: string; sub: string }>,
  locale: string,
): PrepBoxItem[] {
  return rows.map((row, i) => ({
    target: prepTarget(row.key, row.partner, locale),
    label: items[row.key].label,
    sub: rows.findIndex((r) => r.key === row.key) === i ? items[row.key].sub : undefined,
    itemId: row.key,
  }));
}

// 한국어 문단이 어절 중간에서 줄이 바뀌지 않게 (일본어·중국어에 걸면 띄어쓰기가 없어 줄이 안 바뀐다 — 그쪽은 Phrase)
export function keepAll(locale: string): string {
  return locale === "ko" ? "[word-break:keep-all]" : "";
}

// 검색 결과 설명 길이 (구글이 모바일에서 보통 이쯤 자른다)
const DESCRIPTION_MAX = 155;

export function clip(text: string, max = DESCRIPTION_MAX): string {
  const chars = Array.from(text.trim());
  return chars.length > max ? `${chars.slice(0, max - 1).join("").trimEnd()}…` : text.trim();
}
