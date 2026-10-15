import type { MetadataRoute } from "next";

import { CATEGORIES, categorySlug, LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

import { listSitemapEntries } from "@/lib/articles";
import { articlePath, localeAlternates, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

const abs = (path: string) => `${SITE_URL}${path}`;

function languages(subpath: string) {
  return Object.fromEntries(Object.entries(localeAlternates("en", subpath).languages).map(([l, p]) => [l, abs(p)]));
}

// 언어별 URL 마다 다른 언어 대체 링크(hreflang)를 함께 적는다
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await listSitemapEntries();

  const byArticle = new Map<string, typeof entries>();
  for (const e of entries) {
    byArticle.set(e.articleId, [...(byArticle.get(e.articleId) ?? []), e]);
  }

  return [
    ...LOCALES.map((l) => ({
      url: abs(LOCALE_PATH_PREFIX[l]),
      changeFrequency: "hourly" as const,
      priority: 1,
      alternates: { languages: languages("") },
    })),
    ...LOCALES.flatMap((l) =>
      CATEGORIES.map((c) => ({
        url: abs(`${LOCALE_PATH_PREFIX[l]}/c/${categorySlug(c)}`),
        changeFrequency: "daily" as const,
        priority: 0.6,
        alternates: { languages: languages(`/c/${categorySlug(c)}`) },
      })),
    ),
    ...entries.map((e) => {
      const siblings = byArticle.get(e.articleId) ?? [];
      return {
        url: abs(articlePath(e.locale, e.slug)),
        lastModified: e.article.updatedAt,
        priority: 0.8,
        alternates: { languages: Object.fromEntries(siblings.map((s) => [s.locale, abs(articlePath(s.locale, s.slug))])) },
        images: e.article.media.map((m) => m.url),
      };
    }),
  ];
}
