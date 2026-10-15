import { getTranslations } from "next-intl/server";

import { RankedArticles } from "@/components/RankedArticles";
import { listPopular } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";

// 홈의 '지금 인기' 5위까지 (글 끝 '이번 주 인기 글'과 같은 순위표)
export async function TrendingNow({ locale }: { locale: string }) {
  const rows = await listPopular(locale, 5);
  const [t, items] = await Promise.all([getTranslations("Home"), toFeedItems(rows, locale)]);
  return <RankedArticles id="home-trending" title={t("trending")} items={items} locale={locale} />;
}
