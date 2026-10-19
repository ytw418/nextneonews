import { type Locale, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

// 클리닉 시술 목록은 로더(server-only) 대신 사실 파일을 바로 읽는다: next.config.ts 가 이 파일을 불러 X-Robots-Tag 헤더를 만든다
import { CLINIC_ITEMS } from "../data/clinic/items";
import type { ClinicField } from "../data/clinic/types";

// 가이드 섹션(뷰티·여행·클리닉·드라마)을 검색에 어디까지 내는가. next.config.ts(noindex 헤더)와 sitemap.ts 가 함께 읽는다.
// 도메인을 옮긴 직후 AI 보조로 만든 카탈로그 주소 1,500개를 한꺼번에 색인시키지 않으려고 좁게 시작한다 (docs/monetize/BM-VALIDATION.md §3)

// 가이드 섹션 주소의 첫 마디 (/{locale}/beauty/...)
export const GUIDE_SEGMENTS = ["guide", "beauty", "travel", "clinic", "drama"] as const;

// 검색에 내는 언어. 늘릴 때는 이 줄에 더한다 (GSC 색인율 50% 를 넘으면 ko → vi·id → fr·ru·zh-CN 순)
export const GUIDE_INDEX_LOCALES: readonly Locale[] = ["en", "ja", "zh-TW"];

// 변호사 검토(의료법 27·56조, 의료해외진출법) 전에는 검색에 내지 않는 클리닉 분야. 검토가 끝나면 여기서 뺀다
export const CLINIC_NOINDEX_FIELDS: readonly ClinicField[] = ["dental", "plastic"];

export const CLINIC_NOINDEX_SLUGS: readonly string[] = CLINIC_ITEMS.filter((item) =>
  CLINIC_NOINDEX_FIELDS.includes(item.field),
).map((item) => item.slug);

const NOINDEX = [{ key: "X-Robots-Tag", value: "noindex, follow" }];

// 언어 접두사를 뺀 앱 경로(/clinic/implant)가 가이드 섹션인가
export function isGuidePath(subpath: string): boolean {
  const first = subpath.split("/")[1] ?? "";
  return (GUIDE_SEGMENTS as readonly string[]).includes(first);
}

// 이 언어의 이 가이드 주소를 검색에 내는가. 가이드가 아닌 경로는 여기서 정하지 않는다(true)
export function guideIndexable(locale: string, subpath: string): boolean {
  if (!isGuidePath(subpath)) return true;
  if (!(GUIDE_INDEX_LOCALES as readonly string[]).includes(locale)) return false;
  const clinic = /^\/clinic\/([^/]+)$/.exec(subpath);
  return !(clinic && CLINIC_NOINDEX_SLUGS.includes(clinic[1]!));
}

// next.config.ts headers(): 색인하지 않는 언어의 가이드 섹션 전부 + 모든 언어의 치과·성형 시술에 noindex.
// 페이지 메타(robots)는 섹션 화면마다 따로 쓰므로, 한 곳에서 확실히 막으려고 응답 헤더로 단다 (검색엔진은 더 엄한 쪽을 따른다)
export function guideNoindexHeaders(): { source: string; headers: typeof NOINDEX }[] {
  const prefixes = LOCALES.filter((l) => !GUIDE_INDEX_LOCALES.includes(l)).map((l) => LOCALE_PATH_PREFIX[l].slice(1));
  const rules = [];
  if (prefixes.length > 0) {
    rules.push({ source: `/:locale(${prefixes.join("|")})/:section(${GUIDE_SEGMENTS.join("|")})/:path*`, headers: NOINDEX });
  }
  if (CLINIC_NOINDEX_SLUGS.length > 0) {
    rules.push({ source: `/:locale/clinic/:slug(${CLINIC_NOINDEX_SLUGS.join("|")})`, headers: NOINDEX });
  }
  return rules;
}
