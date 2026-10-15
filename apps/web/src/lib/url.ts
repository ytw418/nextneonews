import { isLocale, LOCALE_PATH_PREFIX } from "@kmedia/core";

export const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export function articlePath(locale: string, slug: string): string {
  const prefix = isLocale(locale) ? LOCALE_PATH_PREFIX[locale] : `/${locale}`;
  return `${prefix}/news/${slug}`;
}
