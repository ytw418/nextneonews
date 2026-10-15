import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { UpcomingRail } from "@/components/UpcomingRail";
import { listLatest } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";

export const revalidate = 300;

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, rows] = await Promise.all([getTranslations("Home"), listLatest(locale)]);
  const items = await toFeedItems(rows, locale);

  return (
    <>
      <AppHeader />
      <CategoryRail />
      <UpcomingRail locale={locale} />
      <h2 className="px-4 pb-2.5 pt-6 font-display text-[22px] italic">{t("latest")}</h2>
      <Feed items={items} emptyLabel={t("empty")} />
    </>
  );
}
