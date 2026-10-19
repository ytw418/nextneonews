import "server-only";

import { DEFAULT_LOCALE, type Locale } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { getTranslations } from "next-intl/server";

import { coverGlyph } from "@/components/guide/glyph";
import { categoryTint } from "@/lib/cover";

import { beautyFeatured, beautySummary, isBeautySlug } from "./beauty";
import { BEAUTY_ITEMS } from "./beauty/items";
import { clinicFeatured, clinicSummary, isClinicSlug } from "./clinic";
import { CLINIC_ITEMS } from "./clinic/items";
import { dramaFeatured, dramaSummary, isDramaSlug } from "./drama";
import { DRAMA_ITEMS } from "./drama/items";
import { type CatalogKind, isSavedId, isSavedKind } from "./sections";
import { isTravelSlug, travelFeatured, travelSummary } from "./travel";
import { TRAVEL_ITEMS } from "./travel/items";
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
  return isSavedKind(kind) && isSavedId(kind, id) ? { kind, id } : null;
}

// 카탈로그에 있는 항목인가. 글은 DB 를 봐야 해서 여기서는 slug 모양만 본다 (평가 API 는 글을 받지 않는다)
export function isKnownItem(kind: SavedKind, id: string): boolean {
  if (kind === "article") return isSavedId(kind, id);
  return KNOWN[kind](id);
}

// 글: 번역은 영어 slug 를 그대로 써서 (locale, slug) 로 찾는다. 이 언어 번역이 아직 없으면(vi·id·fr·ru 배치 번역 대기)
// 영어 제목으로 채운다 — 언어를 바꿔도 저장한 글이 '불러오지 못함' 줄로 남지 않게. 링크는 그대로 두면 글 화면이 있는 언어로 보낸다
async function articleSummaries(slugs: string[], locale: Locale): Promise<Map<string, CatalogSummary>> {
  if (slugs.length === 0) return new Map();
  const locales = locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE];
  const [rows, tCat] = await Promise.all([
    prisma.translation.findMany({
      where: { locale: { in: locales }, slug: { in: slugs }, article: { status: "PUBLISHED" } },
      select: { slug: true, locale: true, title: true, article: { select: { category: true } } },
    }),
    getTranslations({ locale, namespace: "Category" }),
  ]);
  const out = new Map<string, CatalogSummary>();
  for (const row of rows) {
    if (row.locale !== locale && out.has(row.slug)) continue; // 이 언어 번역이 이미 있다
    out.set(row.slug, {
      kind: "article",
      id: row.slug,
      href: `/news/${row.slug}`,
      title: row.title,
      sub: tCat(row.article.category),
      tint: categoryTint(row.article.category),
      ...(row.locale === locale ? {} : { lang: row.locale }),
    });
  }
  return out;
}

// ───────── 커버 유령 글자 ─────────
// 요약 한 줄에도 상세와 같은 글자(components/guide/glyph.ts coverGlyph)를 채운다. 저장함·가이드 허브·교차 레일은 이 값을 그대로 쓴다
export type GlyphedSummary = CatalogSummary & { glyph?: string };

const BEAUTY_BRAND = new Map(BEAUTY_ITEMS.map((i) => [i.slug, i.brand]));
const PLACE_AREA = new Map(TRAVEL_ITEMS.map((i) => [i.slug, i.area]));
const CLINIC_DOWNTIME = new Map(CLINIC_ITEMS.map((i) => [i.slug, i.downtimeDays]));
const DRAMA_EPISODES = new Map(DRAMA_ITEMS.map((i) => [i.slug, i.episodes]));

function glyphOf(summary: CatalogSummary, locale: Locale): string | undefined {
  const { kind, id } = summary;
  if (kind === "beauty") {
    const brand = BEAUTY_BRAND.get(id);
    return brand === undefined ? undefined : coverGlyph({ kind, brand });
  }
  if (kind === "place") {
    const area = PLACE_AREA.get(id);
    return area === undefined ? undefined : coverGlyph({ kind, area, areaName: summary.sub ?? "", locale });
  }
  if (kind === "clinic") {
    const downtimeDays = CLINIC_DOWNTIME.get(id);
    return downtimeDays === undefined ? undefined : coverGlyph({ kind, downtimeDays });
  }
  if (kind === "drama") {
    const episodes = DRAMA_EPISODES.get(id);
    return episodes === undefined ? undefined : coverGlyph({ kind, episodes });
  }
  return undefined; // 글: 사실 값이 없어 제목으로 어림한다 (coverGlyph)
}

function withGlyph(summary: CatalogSummary, locale: Locale): GlyphedSummary {
  const glyph = glyphOf(summary, locale);
  return glyph === undefined ? summary : { ...summary, glyph };
}

export async function summarize(kind: SavedKind, id: string, locale: Locale): Promise<GlyphedSummary | null> {
  const summary =
    kind === "article" ? ((await articleSummaries([id], locale)).get(id) ?? null) : await SUMMARY[kind](id, locale);
  return summary && withGlyph(summary, locale);
}

export interface SummaryBatch {
  items: GlyphedSummary[];
  partial: boolean; // 글 조회가 실패해 글 줄을 뺐다 (DB 장애). 부르는 쪽은 이 응답을 캐시하지 않는다
}

// 여러 항목을 한 번에 (글은 쿼리 한 번). 받은 순서 그대로, 없어진 항목(카탈로그에서 빠졌거나 글이 내려감)은 뺀다.
// 글 조회(DB)가 실패해도 카탈로그 항목(DB 없음)은 그대로 돌려준다 — 저장함 한 줄 때문에 나머지까지 못 불러오지 않게
export async function summarizeMany(refs: ItemRef[], locale: Locale): Promise<SummaryBatch> {
  const slugs = refs.filter((r) => r.kind === "article").map((r) => r.id);
  let articles = new Map<string, CatalogSummary>();
  let partial = false;
  try {
    articles = await articleSummaries(slugs, locale);
  } catch (err) {
    console.error("[catalog] 저장한 글 요약을 불러오지 못함", err);
    partial = true;
  }
  const summaries = await Promise.all(
    refs.map((r) => (r.kind === "article" ? (articles.get(r.id) ?? null) : SUMMARY[r.kind](r.id, locale))),
  );
  const items = summaries.filter((s): s is CatalogSummary => s !== null).map((s) => withGlyph(s, locale));
  return { items, partial };
}

export async function featured(section: Section, locale: Locale, n: number): Promise<GlyphedSummary[]> {
  if (n <= 0) return [];
  return (await FEATURED[section](locale, n)).map((s) => withGlyph(s, locale));
}

// 여러 섹션을 번갈아 섞는다 (섹션 순서대로 하나씩). 가이드 허브 '지금 인기'·교차 레일
export async function featuredMix(
  sections: readonly Section[],
  locale: Locale,
  n: number,
  exclude?: string,
): Promise<GlyphedSummary[]> {
  const lists = await Promise.all(sections.map((s) => featured(s, locale, n + 1)));
  const pool = lists.map((list) => list.filter((item) => item.id !== exclude));
  const out: GlyphedSummary[] = [];
  for (let round = 0; out.length < n && pool.some((list) => list.length > round); round += 1) {
    for (const list of pool) if (list[round] && out.length < n) out.push(list[round]);
  }
  return out;
}
