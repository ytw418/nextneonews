export const LOCALES = ["en", "ja", "zh-TW", "zh-CN", "ko", "vi", "id", "fr", "ru"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

// URL 경로에는 소문자를 쓴다 (/zh-tw/...)
export const LOCALE_PATH_PREFIX: Record<Locale, string> = {
  en: "/en",
  ja: "/ja",
  "zh-TW": "/zh-tw",
  "zh-CN": "/zh-cn",
  ko: "/ko",
  vi: "/vi",
  id: "/id",
  fr: "/fr",
  ru: "/ru",
};

// 언어 고르기·llms.txt 에 쓰는 각 언어의 자기 이름
export const LOCALE_NAME: Record<Locale, string> = {
  en: "English",
  ja: "日本語",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ko: "한국어",
  vi: "Tiếng Việt",
  id: "Bahasa Indonesia",
  fr: "Français",
  ru: "Русский",
};

// 기사를 쓸 때 한 번에 만드는 언어 (zh-CN 은 zh-TW 를 OpenCC 로 바꾼다)
// 나머지는 영어판을 배치 번역으로 채운다 (apps/worker/src/pipeline/translate.ts)
export const BATCH_LOCALES = ["vi", "id", "fr", "ru"] as const satisfies readonly Locale[];
export type BatchLocale = (typeof BATCH_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

// 브라우저 언어(navigator.languages, Accept-Language)를 우리 언어로 맞춘다. 없으면 null
export function matchLocale(tag: string): Locale | null {
  const lower = tag.toLowerCase();
  if (lower.startsWith("zh")) {
    // 번체: zh-TW, zh-HK, zh-MO, zh-Hant. 나머지 중국어는 간체
    return /^zh-(tw|hk|mo|hant)/.test(lower) ? "zh-TW" : "zh-CN";
  }
  const primary = lower.split("-")[0];
  // 인도네시아어 옛 코드 in, 말레이어 ms 는 인도네시아어로 읽을 수 있다
  if (primary === "in" || primary === "ms") return "id";
  return LOCALES.find((l) => l === primary) ?? null;
}
