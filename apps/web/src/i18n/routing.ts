import { DEFAULT_LOCALE, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: { mode: "always", prefixes: LOCALE_PATH_PREFIX },
  // 페이지마다 실제로 있는 번역만 hreflang 으로 낸다 (generateMetadata·sitemap). 미들웨어의 Link 헤더는
  // 번역이 아직 없는 vi·id·fr·ru 주소까지 넣어 404 를 가리키므로 끈다
  alternateLinks: false,
});
