import { getTranslations } from "next-intl/server";

import type { FeedItem } from "@/components/FeedCard";

import type { FeedRow } from "./articles";
import { timeAgo } from "./time";

export async function toFeedItems(rows: FeedRow[], locale: string): Promise<FeedItem[]> {
  const t = await getTranslations("Category");
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.article.category,
    categoryLabel: t(row.article.category),
    timeAgo: timeAgo(row.article.publishedAt, locale),
    locale,
    imageUrl: row.article.media[0]?.url,
    credit: row.article.media[0],
  }));
}
