import type { MetadataRoute } from "next";

import { LOCALE_PATH_PREFIX, LOCALES } from "@kmedia/core";

import { listSitemapEntries } from "@/lib/articles";
import { articlePath, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await listSitemapEntries();

  return [
    ...LOCALES.map((locale) => ({ url: `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}` })),
    ...entries.map((entry) => ({
      url: `${SITE_URL}${articlePath(entry.locale, entry.slug)}`,
      lastModified: entry.article.updatedAt,
    })),
  ];
}
