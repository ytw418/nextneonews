import { getTranslations } from "next-intl/server";

import { FeedCard } from "@/components/FeedCard";
import { RankedArticles } from "@/components/RankedArticles";
import { listLatest, listPopular, toFeedItems } from "@/lib/articles";

const TAKE = 4;

// 홈 첫 화면의 '지금 많이 읽는 글': 1위는 사진 큰 카드, 2~4위는 순위 줄. 최근 이틀 조회순이고,
// 조회가 모자라면(새 언어) 최신 글로 채운다. 큰 카드는 사진이 있는 글을 앞으로 당긴다 (첫 화면이 회색 카드면 '사진이 안 뜬' 것처럼 보였다)
export async function TopStories({ locale }: { locale: string }) {
  const popular = await listPopular(locale, TAKE, 2);
  const rows = popular.length >= 3 ? popular : await listLatest(locale, TAKE);
  const [t, items] = await Promise.all([getTranslations("Feed"), toFeedItems(rows, locale)]);
  if (items.length === 0) return null;
  const leadIndex = Math.max(0, items.findIndex((item) => item.imageUrl));
  const lead = items[leadIndex]!;
  const rest = items.filter((_, i) => i !== leadIndex);

  return (
    <RankedArticles
      id="home-top"
      title={t("popular")}
      items={rest}
      locale={locale}
      lead={<FeedCard item={lead} variant="lead" priority />}
    />
  );
}

// 아래 '이번 주 인기'가 같은 글을 되풀이하지 않게 첫 화면에 쓴 글 slug
export async function topStorySlugs(locale: string): Promise<string[]> {
  const popular = await listPopular(locale, TAKE, 2);
  const rows = popular.length >= 3 ? popular : await listLatest(locale, TAKE);
  return rows.map((r) => r.slug);
}
