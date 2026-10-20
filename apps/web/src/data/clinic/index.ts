import "server-only";

import type { Locale } from "@kmedia/core";

import { clinicCover } from "../cover";
import { isNew, SECTION_TINT } from "../sections";
import { textLoader } from "../text";
import type { CatalogSummary } from "../types";
import { CLINIC_ITEMS } from "./items";
import type { ClinicText, Procedure, ProcedureText } from "./types";

export type ClinicEntry = Procedure & { text: ProcedureText };

// 요청 언어 파일만 읽는다 (없는 키는 영어로). 클라이언트 컴포넌트는 이 로더를 import 하지 않고 props 로 받는다
export const clinicText: (locale: Locale) => Promise<ClinicText> = textLoader((locale) =>
  import(`./text/${locale}.json`),
);

const SLUGS = new Set(CLINIC_ITEMS.map((item) => item.slug));

export function clinicSlugs(): string[] {
  return [...SLUGS];
}

export function isClinicSlug(slug: string): boolean {
  return SLUGS.has(slug);
}

// 문구가 없는 시술(영어에도 없음)은 빠진다
export async function listClinic(locale: Locale): Promise<ClinicEntry[]> {
  const { procedures } = await clinicText(locale);
  return CLINIC_ITEMS.flatMap((item) => {
    const text = procedures[item.slug];
    return text ? [{ ...item, text }] : [];
  });
}

export async function getClinic(slug: string, locale: Locale): Promise<ClinicEntry | null> {
  const item = CLINIC_ITEMS.find((i) => i.slug === slug);
  if (!item) return null;
  const text = (await clinicText(locale)).procedures[slug];
  return text ? { ...item, text } : null;
}

function summary(entry: ClinicEntry, fields: ClinicText["fields"]): CatalogSummary {
  return {
    kind: "clinic",
    id: entry.slug,
    href: `/clinic/${entry.slug}`,
    title: entry.text.name,
    sub: fields[entry.field]?.name,
    tint: SECTION_TINT.clinic,
    cover: clinicCover(entry),
    ...(isNew(entry.addedAt) ? { badge: "new" as const } : {}),
  };
}

export async function clinicSummary(slug: string, locale: Locale): Promise<CatalogSummary | null> {
  const [entry, text] = await Promise.all([getClinic(slug, locale), clinicText(locale)]);
  return entry ? summary(entry, text.fields) : null;
}

// 시술에는 편집 점수가 없다 (인기·효과 순위를 매기지 않는다). 카탈로그 순서 그대로
export async function clinicFeatured(locale: Locale, n: number): Promise<CatalogSummary[]> {
  const [entries, text] = await Promise.all([listClinic(locale), clinicText(locale)]);
  return entries.slice(0, n).map((entry) => summary(entry, text.fields));
}
