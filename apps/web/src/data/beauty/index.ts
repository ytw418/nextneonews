import "server-only";

import type { Locale } from "@kmedia/core";

import { beautyCover } from "../cover";
import { isNew, SECTION_TINT } from "../sections";
import { textLoader } from "../text";
import type { CatalogSummary } from "../types";
import { BEAUTY_ITEMS } from "./items";
import { BEAUTY_PHOTOS } from "./photos";
import type { BeautyProduct, BeautyProductText, BeautyTextFile } from "./types";

export type BeautyEntry = BeautyProduct & { text: BeautyProductText };

// 요청 언어 파일만 읽는다 (없는 키는 영어로). 클라이언트 컴포넌트는 이 로더를 import 하지 않고 props 로 받는다
export const beautyText: (locale: Locale) => Promise<BeautyTextFile> = textLoader((locale) =>
  import(`./text/${locale}.json`),
);

const SLUGS = new Set(BEAUTY_ITEMS.map((item) => item.slug));

export function beautySlugs(): string[] {
  return [...SLUGS];
}

export function isBeautySlug(slug: string): boolean {
  return SLUGS.has(slug);
}

// 오려 낸 제품 사진(photos.ts, 스크립트가 만든다)을 붙인다. 사진이 없는 제품은 그대로 (커버는 아이콘)
const withPhoto = (item: BeautyProduct): BeautyProduct =>
  BEAUTY_PHOTOS[item.slug] ? { ...item, photo: BEAUTY_PHOTOS[item.slug] } : item;

// 문구가 없는 제품(영어에도 없음)은 빠진다 — 반쯤 빈 화면을 내지 않는다
export async function listBeauty(locale: Locale): Promise<BeautyEntry[]> {
  const { products } = await beautyText(locale);
  return BEAUTY_ITEMS.flatMap((item) => {
    const text = products[item.slug];
    return text ? [{ ...withPhoto(item), text }] : [];
  });
}

export async function getBeauty(slug: string, locale: Locale): Promise<BeautyEntry | null> {
  const item = BEAUTY_ITEMS.find((i) => i.slug === slug);
  if (!item) return null;
  const text = (await beautyText(locale)).products[slug];
  return text ? { ...withPhoto(item), text } : null;
}

function summary(entry: BeautyEntry): CatalogSummary {
  return {
    kind: "beauty",
    id: entry.slug,
    href: `/beauty/p/${entry.slug}`,
    title: entry.text.name,
    sub: entry.brand,
    tint: SECTION_TINT.beauty,
    cover: beautyCover(entry),
    ...(isNew(entry.addedAt) ? { badge: "new" as const } : {}),
  };
}

export async function beautySummary(slug: string, locale: Locale): Promise<CatalogSummary | null> {
  const entry = await getBeauty(slug, locale);
  return entry ? summary(entry) : null;
}

// 편집 점수 상위 (같으면 최근에 넣은 것)
export async function beautyFeatured(locale: Locale, n: number): Promise<CatalogSummary[]> {
  const entries = await listBeauty(locale);
  return entries
    .toSorted((a, b) => b.editorialScore - a.editorialScore || b.addedAt.localeCompare(a.addedAt))
    .slice(0, n)
    .map(summary);
}
