import type { CategoryKey } from "@kmedia/core";

import type { SavedKind, Section } from "./types";

// 가이드 섹션의 순서·주소·틴트. 서버·클라이언트 어디서나 쓴다 (카탈로그 데이터는 없다)
export const SECTIONS: readonly Section[] = ["beauty", "travel", "clinic", "drama"];

export const SECTION_PATH: Record<Section, string> = {
  beauty: "/beauty",
  travel: "/travel",
  clinic: "/clinic",
  drama: "/drama",
};

// 클리닉 틴트는 카테고리가 아니라 섹션 전용 (globals.css --tint-clinic)
export const SECTION_TINT: Record<Section, string> = {
  beauty: "var(--tint-kbeauty)",
  travel: "var(--tint-travel)",
  clinic: "var(--tint-clinic)",
  drama: "var(--tint-kdrama)",
};

// 뉴스 카테고리 → 이어서 볼 가이드 섹션 (카테고리 피드의 가이드 소개·글 끝 교차 레일). 의료(클리닉)로는 보내지 않는다
export function categorySection(category: CategoryKey | string): Section {
  if (category === "KDRAMA" || category === "KENT" || category === "KPOP") return "drama";
  if (category === "TRAVEL" || category === "KFOOD" || category === "WORKING_HOLIDAY") return "travel";
  return "beauty";
}

export type CatalogKind = Exclude<SavedKind, "article">;

// 섹션 ↔ 저장 종류 (여행은 명소 단위로 저장한다)
export const SECTION_KIND: Record<Section, CatalogKind> = {
  beauty: "beauty",
  travel: "place",
  clinic: "clinic",
  drama: "drama",
};

export const KIND_SECTION: Record<CatalogKind, Section> = {
  beauty: "beauty",
  place: "travel",
  clinic: "clinic",
  drama: "drama",
};

// 저장 종류·ID 규칙은 여기 하나: 서버(/api/saved·평가 API)와 이 기기 저장소(lib/saved.ts)·공유 링크가 같은 규칙으로 거른다
export const SAVED_KINDS: readonly SavedKind[] = ["article", "beauty", "place", "clinic", "drama"];

export function isSavedKind(value: unknown): value is SavedKind {
  return typeof value === "string" && (SAVED_KINDS as readonly string[]).includes(value);
}

// 카탈로그 slug (proxy.ts matcher 때문에 점 금지). 글 slug 는 영어 제목에서 만들어 더 길다
export const CATALOG_SLUG = /^[a-z0-9-]{2,64}$/;
export const ARTICLE_SLUG = /^[a-z0-9][a-z0-9-]{1,159}$/;

// 이 종류의 저장 ID 로 맞는 모양인가 (글은 ARTICLE_SLUG, 나머지는 CATALOG_SLUG)
export function isSavedId(kind: SavedKind, id: unknown): id is string {
  return typeof id === "string" && (kind === "article" ? ARTICLE_SLUG : CATALOG_SLUG).test(id);
}

// 'NEW' 배지: 카탈로그에 넣은 지 14일 이내 (순위 변동 배지 대신 — 첫날엔 이력이 없어 거짓 신호가 된다)
const NEW_DAYS = 14;

export function isNew(addedAt: string, now = Date.now()): boolean {
  const added = Date.parse(`${addedAt}T00:00:00+09:00`);
  return Number.isFinite(added) && now - added < NEW_DAYS * 86_400_000;
}
