export const LOCALES = ["en", "ja", "zh-TW", "ko"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// URL 경로에는 소문자를 쓴다 (/zh-tw/...)
export const LOCALE_PATH_PREFIX: Record<Locale, string> = {
  en: "/en",
  ja: "/ja",
  "zh-TW": "/zh-tw",
  ko: "/ko",
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
