import type { Locale } from "@kmedia/core";

import { displayName } from "@/lib/rankings";

import PEOPLE from "./people.json";

// 드라마 출연·명소 관련 인물: 위키데이터 Q-id → 화면 언어 이름 + 인물 페이지 slug.
// 인물 사전(Entity)을 빌드에 실은 사본(people.json, sync-people.mjs 가 만든다)이라 화면이 DB 를 부르지 않는다

export interface CatalogPerson {
  name: string;
  slug: string | null; // 인물 페이지(/idol/slug)가 있을 때만
}

interface PersonRow {
  slug?: string;
  en?: string;
  ko?: string;
  ja?: string;
  zhHant?: string;
}

const ROWS: Record<string, PersonRow> = PEOPLE;

// 사전에 없는 인물은 null (부르는 쪽이 카탈로그의 영문 이름을 쓴다). 이름 규칙은 랭킹·인물 화면과 같다(lib/rankings displayName)
export function catalogPerson(id: string, locale: Locale): CatalogPerson | null {
  const row = ROWS[id];
  if (!row) return null;
  const names = { en: row.en ?? null, ko: row.ko ?? null, ja: row.ja ?? null, zhHant: row.zhHant ?? null };
  return { name: displayName(names, locale, id), slug: row.slug ?? null };
}
