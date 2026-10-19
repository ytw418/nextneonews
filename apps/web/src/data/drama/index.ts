import "server-only";

import type { Locale } from "@kmedia/core";

import { isNew, SECTION_TINT } from "../sections";
import { textLoader } from "../text";
import type { CatalogSummary } from "../types";
import { DRAMA_ITEMS } from "./items";
import type { Drama, DramaText, DramaTextFile } from "./types";

export type DramaEntry = Drama & { text: DramaText };

// 요청 언어 파일만 읽는다 (없는 키는 영어로). 클라이언트 컴포넌트는 이 로더를 import 하지 않고 props 로 받는다
export const dramaText: (locale: Locale) => Promise<DramaTextFile> = textLoader((locale) =>
  import(`./text/${locale}.json`),
);

const SLUGS = new Set(DRAMA_ITEMS.map((item) => item.slug));

export function dramaSlugs(): string[] {
  return [...SLUGS];
}

export function isDramaSlug(slug: string): boolean {
  return SLUGS.has(slug);
}

// 문구가 없는 작품(영어에도 없음)은 빠진다
export async function listDrama(locale: Locale): Promise<DramaEntry[]> {
  const { dramas } = await dramaText(locale);
  return DRAMA_ITEMS.flatMap((item) => {
    const text = dramas[item.slug];
    return text ? [{ ...item, text }] : [];
  });
}

export async function getDrama(slug: string, locale: Locale): Promise<DramaEntry | null> {
  const item = DRAMA_ITEMS.find((i) => i.slug === slug);
  if (!item) return null;
  const text = (await dramaText(locale)).dramas[slug];
  return text ? { ...item, text } : null;
}

function summary(entry: DramaEntry): CatalogSummary {
  return {
    kind: "drama",
    id: entry.slug,
    href: `/drama/${entry.slug}`,
    title: entry.text.title,
    sub: `${entry.year} · ${entry.network}`,
    tint: SECTION_TINT.drama,
    ...(isNew(entry.addedAt) ? { badge: "new" as const } : {}),
  };
}

export async function dramaSummary(slug: string, locale: Locale): Promise<CatalogSummary | null> {
  const entry = await getDrama(slug, locale);
  return entry ? summary(entry) : null;
}

// 편집 점수 상위 (같으면 최근에 넣은 것)
export async function dramaFeatured(locale: Locale, n: number): Promise<CatalogSummary[]> {
  const entries = await listDrama(locale);
  return entries
    .toSorted((a, b) => b.editorialScore - a.editorialScore || b.addedAt.localeCompare(a.addedAt))
    .slice(0, n)
    .map(summary);
}
