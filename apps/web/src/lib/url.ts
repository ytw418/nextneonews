import { LOCALE_PATH_PREFIX, LOCALES, SITE_NAME } from "@kmedia/core";

export { articlePath, localeHomePath } from "@kmedia/core";

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

// Open Graph 의 og:locale 형식
const OG_LOCALE: Record<(typeof LOCALES)[number], string> = {
  en: "en_US",
  ja: "ja_JP",
  "zh-TW": "zh_TW",
  "zh-CN": "zh_CN",
  ko: "ko_KR",
};

// 언어 접두사를 뺀 경로(홈은 "")로 canonical + 언어별 대체 링크(hreflang) + x-default 를 만든다
export function localeAlternates(locale: string, subpath = "") {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [l, `${LOCALE_PATH_PREFIX[l]}${subpath}`]),
  );
  languages["x-default"] = `${LOCALE_PATH_PREFIX.en}${subpath}`;
  const prefix = (LOCALE_PATH_PREFIX as Record<string, string>)[locale] ?? `/${locale}`;
  return { canonical: `${prefix}${subpath}`, languages };
}

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
