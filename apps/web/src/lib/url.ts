import { LOCALE_PATH_PREFIX, type Locale, LOCALES, SITE_NAME } from "@kmedia/core";

export { articlePath, localeHomePath } from "@kmedia/core";

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Open Graph 의 og:locale 형식
const OG_LOCALE: Record<(typeof LOCALES)[number], string> = {
  en: "en_US",
  ja: "ja_JP",
  "zh-TW": "zh_TW",
  "zh-CN": "zh_CN",
  ko: "ko_KR",
  vi: "vi_VN",
  id: "id_ID",
  fr: "fr_FR",
  ru: "ru_RU",
};

function prefixOf(locale: string): string {
  return (LOCALE_PATH_PREFIX as Record<string, string>)[locale] ?? `/${locale}`;
}

// 언어별 RSS (/zh-tw/feed.xml)
export function feedPath(locale: string): string {
  return `${prefixOf(locale)}/feed.xml`;
}

// <link rel="alternate" type="application/rss+xml"> — 페이지 alternates 가 레이아웃 값을 통째로 덮어쓰므로 여기서 함께 낸다
export function feedAlternate(locale: string) {
  return { "application/rss+xml": feedPath(locale) };
}

// 주소 접두사(zh-tw)·언어 코드(zh-TW) 어느 쪽이 와도 Locale 로. 없는 언어면 null
export function localeFromPrefix(value: string): Locale | null {
  const lower = value.toLowerCase();
  return LOCALES.find((l) => LOCALE_PATH_PREFIX[l] === `/${lower}`) ?? null;
}

// 언어 접두사를 뺀 경로(홈은 "")로 canonical + 언어별 대체 링크(hreflang) + x-default + RSS 를 만든다
export function localeAlternates(locale: string, subpath = "") {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [l, `${LOCALE_PATH_PREFIX[l]}${subpath}`]),
  );
  languages["x-default"] = `${LOCALE_PATH_PREFIX.en}${subpath}`;
  return { canonical: `${prefixOf(locale)}${subpath}`, languages, types: feedAlternate(locale) };
}

// 검색 결과·디스커버에 큰 사진과 긴 스니펫을 허용한다 (구글·빙 모두 robots 메타를 읽는다). 레이아웃 기본값이고,
// 페이지가 robots 키를 내면(undefined 라도) 이 값이 통째로 사라지므로 noindex 여부를 바꿀 때도 이 함수로 낸다
export function pageRobots(index = true) {
  return { index, follow: true, "max-image-preview": "large" as const, "max-snippet": -1, "max-video-preview": -1 };
}
export const GOOGLEBOT_PREVIEW = "max-image-preview:large, max-snippet:-1, max-video-preview:-1";

// 페이지별 openGraph 가 레이아웃 값을 통째로 덮어쓰므로 공통값을 함께 넣는다
export function ogBase(locale: string) {
  return {
    siteName: SITE_NAME,
    locale: OG_LOCALE[locale as keyof typeof OG_LOCALE] ?? "en_US",
    alternateLocale: Object.entries(OG_LOCALE)
      .filter(([l]) => l !== locale)
      .map(([, og]) => og),
  };
}
