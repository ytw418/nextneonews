import { DEFAULT_LOCALE, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: { mode: "always", prefixes: LOCALE_PATH_PREFIX },
});
