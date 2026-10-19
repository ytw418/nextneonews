import { type Locale, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

// 클리닉 시술 목록은 로더(server-only) 대신 사실 파일을 바로 읽는다: next.config.ts 가 이 파일을 불러 X-Robots-Tag 헤더를 만든다
import { CLINIC_ITEMS } from "../data/clinic/items";
import type { ClinicField } from "../data/clinic/types";
import { localeAlternates, pageRobots } from "./url";

// 가이드 섹션(뷰티·여행·클리닉·드라마)을 검색에 어디까지 내는가. next.config.ts(noindex 헤더)·sitemap.ts·가이드 페이지 메타(robots·hreflang)가 모두 여기를 읽는다.
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

// 이 가이드 주소를 검색에 내는 언어 (sitemap.ts 와 HTML hreflang 이 같은 목록을 쓴다). 치과·성형 시술이면 빈 목록
export function guideIndexLocales(subpath: string): Locale[] {
  return GUIDE_INDEX_LOCALES.filter((l) => guideIndexable(l, subpath));
}

// 가이드 페이지 메타의 alternates: hreflang 을 사이트맵처럼 검색에 내는 언어끼리만 잇는다 (noindex 주소를 대체 페이지로 알리지 않는다).
// canonical·RSS 는 noindex 언어에서도 자기 주소 그대로 둔다. x-default 는 영어판이 남을 때만
export function guideAlternates(locale: string, subpath: string) {
  const all = localeAlternates(locale, subpath);
  const languages: Record<string, string> = Object.fromEntries(
    guideIndexLocales(subpath).map((l) => [l, all.languages[l]!]),
  );
  if (languages.en) languages["x-default"] = languages.en;
  return { ...all, languages };
}

// 가이드 페이지 메타의 robots: 응답 헤더(guideNoindexHeaders)와 같은 판정으로 noindex, follow 를 낸다
export function guideRobots(locale: string, subpath: string) {
  return pageRobots(guideIndexable(locale, subpath));
}

// next.config.ts headers(): 색인하지 않는 언어의 가이드 섹션 전부 + 모든 언어의 치과·성형 시술에 noindex.
// 페이지 메타(guideRobots)도 같은 판정을 쓰지만, 화면을 새로 붙일 때 빠뜨려도 막히도록 응답 헤더로 한 번 더 단다
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
