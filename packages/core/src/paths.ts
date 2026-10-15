import { isLocale, LOCALE_PATH_PREFIX } from "./locales";

export function localeHomePath(locale: string): string {
  return isLocale(locale) ? LOCALE_PATH_PREFIX[locale] : `/${locale}`;
}

export function articlePath(locale: string, slug: string): string {
  return `${localeHomePath(locale)}/news/${slug}`;
}
