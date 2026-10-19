import "server-only";

import type { Locale } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { getTranslations } from "next-intl/server";

import { categoryTint } from "@/lib/cover";

import { beautyFeatured, beautySummary, isBeautySlug } from "./beauty";
import { clinicFeatured, clinicSummary, isClinicSlug } from "./clinic";
import { dramaFeatured, dramaSummary, isDramaSlug } from "./drama";
import { ARTICLE_SLUG, CATALOG_SLUG, type CatalogKind, isSavedKind } from "./sections";
import { isTravelSlug, travelFeatured, travelSummary } from "./travel";
import type { CatalogSummary, SavedKind, Section } from "./types";

// 섹션 카탈로그를 한데 묶는 곳: 저장함(/api/saved)·교차 레일·가이드 허브·평가 API(isKnownItem)가 쓴다

export interface ItemRef {
  kind: SavedKind;
  id: string;
}

const SUMMARY: Record<CatalogKind, (id: string, locale: Locale) => Promise<CatalogSummary | null>> = {
  beauty: beautySummary,
  place: travelSummary,
  clinic: clinicSummary,
  drama: dramaSummary,
};

const KNOWN: Record<CatalogKind, (id: string) => boolean> = {
  beauty: isBeautySlug,
  place: isTravelSlug,
  clinic: isClinicSlug,
  drama: isDramaSlug,
};

const FEATURED: Record<Section, (locale: Locale, n: number) => Promise<CatalogSummary[]>> = {
  beauty: beautyFeatured,
  travel: travelFeatured,
  clinic: clinicFeatured,
  drama: dramaFeatured,
};

// "kind:id" (저장함 공유 링크·/api/saved 쿼리 한 칸). 모양이 틀리면 null
export function parseItemRef(value: string): ItemRef | null {
  const at = value.indexOf(":");
  if (at < 0) return null;
  const kind = value.slice(0, at);
  const id = value.slice(at + 1);
  if (!isSavedKind(kind)) return null;
  return (kind === "article" ? ARTICLE_SLUG : CATALOG_SLUG).test(id) ? { kind, id } : null;
}

// 카탈로그에 있는 항목인가. 글은 DB 를 봐야 해서 여기서는 slug 모양만 본다 (평가 API 는 글을 받지 않는다)
export function isKnownItem(kind: SavedKind, id: string): boolean {
  if (kind === "article") return ARTICLE_SLUG.test(id);
  return KNOWN[kind](id);
}

// 글: 번역은 영어 slug 를 그대로 써서 (locale, slug) 로 찾는다. 이 언어 번역이 없으면 빠진다
async function articleSummaries(slugs: string[], locale: Locale): Promise<Map<string, CatalogSummary>> {
  if (slugs.length === 0) return new Map();
  const [rows, tCat] = await Promise.all([
    prisma.translation.findMany({
      where: { locale, slug: { in: slugs }, article: { status: "PUBLISHED" } },
      select: { slug: true, title: true, article: { select: { category: true } } },
    }),
    getTranslations({ locale, namespace: "Category" }),
  ]);
  return new Map(
    rows.map((row) => [
      row.slug,
      {
        kind: "article",
        id: row.slug,
        href: `/news/${row.slug}`,
        title: row.title,
        sub: tCat(row.article.category),
        tint: categoryTint(row.article.category),
      },
    ]),
  );
}

export async function summarize(kind: SavedKind, id: string, locale: Locale): Promise<CatalogSummary | null> {
  if (kind === "article") return (await articleSummaries([id], locale)).get(id) ?? null;
  return SUMMARY[kind](id, locale);
}

// 여러 항목을 한 번에 (글은 쿼리 한 번). 받은 순서 그대로, 없어진 항목(카탈로그에서 빠졌거나 글이 내려감)은 뺀다
export async function summarizeMany(refs: ItemRef[], locale: Locale): Promise<CatalogSummary[]> {
  const articles = await articleSummaries(
    refs.filter((r) => r.kind === "article").map((r) => r.id),
    locale,
  );
  const summaries = await Promise.all(
    refs.map((r) => (r.kind === "article" ? (articles.get(r.id) ?? null) : SUMMARY[r.kind](r.id, locale))),
  );
  return summaries.filter((s): s is CatalogSummary => s !== null);
}

export async function featured(section: Section, locale: Locale, n: number): Promise<CatalogSummary[]> {
  return n > 0 ? FEATURED[section](locale, n) : [];
}

// 여러 섹션을 번갈아 섞는다 (섹션 순서대로 하나씩). 가이드 허브 '지금 인기'·교차 레일
export async function featuredMix(
  sections: readonly Section[],
  locale: Locale,
  n: number,
  exclude?: string,
): Promise<CatalogSummary[]> {
  const lists = await Promise.all(sections.map((s) => featured(s, locale, n + 1)));
  const pool = lists.map((list) => list.filter((item) => item.id !== exclude));
  const out: CatalogSummary[] = [];
  for (let round = 0; out.length < n && pool.some((list) => list.length > round); round += 1) {
    for (const list of pool) if (list[round] && out.length < n) out.push(list[round]);
  }
  return out;
}
