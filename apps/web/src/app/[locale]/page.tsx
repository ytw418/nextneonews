import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SITE_NAME } from "@kmedia/core";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { UpcomingRail } from "@/components/UpcomingRail";
import { listLatest } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";
import { localeAlternates, ogBase } from "@/lib/url";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });
  const title = `${SITE_NAME} — ${t("tagline")}`;
  const alternates = localeAlternates(locale);
  return {
    title: { absolute: title },
    description: t("tagline"),
    alternates,
    openGraph: { ...ogBase(locale), type: "website", url: alternates.canonical, title, description: t("tagline") },
    twitter: { card: "summary_large_image" },
  };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tSite, rows] = await Promise.all([getTranslations("Home"), getTranslations("Site"), listLatest(locale)]);
  const items = await toFeedItems(rows, locale);

  return (
    <>
      <AppHeader />
      <h1 className="sr-only">
        {SITE_NAME} — {tSite("tagline")}
      </h1>
      <CategoryRail />
      <UpcomingRail locale={locale} />
      <h2 className="px-4 pb-2.5 pt-6 font-display text-[22px] italic">{t("latest")}</h2>
      <Feed items={items} emptyLabel={t("empty")} />
    </>
  );
}
