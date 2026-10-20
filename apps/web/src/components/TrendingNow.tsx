import { getTranslations } from "next-intl/server";

import { RankedArticles } from "@/components/RankedArticles";
import { listPopular, toFeedItems } from "@/lib/articles";

// 홈의 '지금 인기' 5위까지 (글 끝 '이번 주 인기 글'과 같은 순위표). exclude: 첫 화면에 이미 나온 글
export async function TrendingNow({ locale, exclude = [] }: { locale: string; exclude?: string[] }) {
  const rows = (await listPopular(locale, 5 + exclude.length)).filter((r) => !exclude.includes(r.slug)).slice(0, 5);
  const [t, items] = await Promise.all([getTranslations("Home"), toFeedItems(rows, locale)]);
  return <RankedArticles id="home-trending" title={t("trending")} items={items} locale={locale} />;
}
