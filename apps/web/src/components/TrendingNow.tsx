import { getTranslations } from "next-intl/server";

import { RankedArticles } from "@/components/RankedArticles";
import { listTrending, toFeedItems } from "@/lib/articles";

// 홈의 '실시간 인기' 5위까지: 최근 24시간 조회 순 (조회가 모자라면 주간 순위). 글 끝 '이번 주 인기 글'과 같은 순위표
export async function TrendingNow({ locale }: { locale: string }) {
  const rows = await listTrending(locale, 5);
  const [t, items] = await Promise.all([getTranslations("Home"), toFeedItems(rows, locale)]);
  return <RankedArticles id="home-trending" title={t("trending")} items={items} locale={locale} />;
}
