import "server-only";

import type { Locale } from "@kmedia/core";

import { placeCover } from "../cover";
import { isNew, SECTION_TINT } from "../sections";
import { textLoader } from "../text";
import type { CatalogSummary } from "../types";
import { TRAVEL_ITEMS } from "./items";
import { AREA_SLUGS, type AreaSlug, type AreaText, type Place, type PlaceText, type TravelText } from "./types";

export type TravelEntry = Place & { text: PlaceText };
export interface AreaEntry {
  slug: AreaSlug;
  text: AreaText;
  places: TravelEntry[];
}

// 요청 언어 파일만 읽는다 (없는 키는 영어로). 클라이언트 컴포넌트는 이 로더를 import 하지 않고 props 로 받는다
export const travelText: (locale: Locale) => Promise<TravelText> = textLoader((locale) =>
  import(`./text/${locale}.json`),
);

const SLUGS = new Set(TRAVEL_ITEMS.map((item) => item.slug));

// ── 명소 (저장 종류 place) ──

export function travelSlugs(): string[] {
  return [...SLUGS];
}

export function isTravelSlug(slug: string): boolean {
  return SLUGS.has(slug);
}

// 문구가 없는 명소(영어에도 없음)는 빠진다
export async function listTravel(locale: Locale): Promise<TravelEntry[]> {
  const { places } = await travelText(locale);
  return TRAVEL_ITEMS.flatMap((item) => {
    const text = places[item.slug];
    return text ? [{ ...item, text }] : [];
  });
}

export async function getTravel(slug: string, locale: Locale): Promise<TravelEntry | null> {
  const item = TRAVEL_ITEMS.find((i) => i.slug === slug);
  if (!item) return null;
  const text = (await travelText(locale)).places[slug];
  return text ? { ...item, text } : null;
}

function summary(entry: TravelEntry, areas: TravelText["areas"]): CatalogSummary {
  return {
    kind: "place",
    id: entry.slug,
    href: `/travel/place/${entry.slug}`,
    title: entry.text.name,
    sub: areas[entry.area]?.name,
    tint: SECTION_TINT.travel,
    cover: placeCover(entry),
    ...(isNew(entry.addedAt) ? { badge: "new" as const } : {}),
  };
}

export async function travelSummary(slug: string, locale: Locale): Promise<CatalogSummary | null> {
  const [entry, text] = await Promise.all([getTravel(slug, locale), travelText(locale)]);
  return entry ? summary(entry, text.areas) : null;
}

// 명소에는 편집 점수가 없어서 동네를 돌아가며 하나씩 (카탈로그 순서가 편집 순서)
export async function travelFeatured(locale: Locale, n: number): Promise<CatalogSummary[]> {
  const [entries, text] = await Promise.all([listTravel(locale), travelText(locale)]);
  const byArea = AREA_SLUGS.map((area) => entries.filter((e) => e.area === area));
  const picked: TravelEntry[] = [];
  for (let round = 0; picked.length < n && byArea.some((list) => list.length > round); round += 1) {
    for (const list of byArea) if (list[round] && picked.length < n) picked.push(list[round]);
  }
  return picked.map((entry) => summary(entry, text.areas));
}

// ── 동네 ──

export function areaSlugs(): AreaSlug[] {
  return [...AREA_SLUGS];
}

// 문구가 없는 동네는 빠진다. 명소는 카탈로그 순서
export async function listAreas(locale: Locale): Promise<AreaEntry[]> {
  const [entries, text] = await Promise.all([listTravel(locale), travelText(locale)]);
  return AREA_SLUGS.flatMap((slug) => {
    const area = text.areas[slug];
    return area ? [{ slug, text: area, places: entries.filter((e) => e.area === slug) }] : [];
  });
}

export async function getArea(slug: string, locale: Locale): Promise<AreaEntry | null> {
  return (await listAreas(locale)).find((a) => a.slug === slug) ?? null;
}
