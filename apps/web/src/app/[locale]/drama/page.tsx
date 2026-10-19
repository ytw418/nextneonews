import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { AdBand } from "@/components/drama/AdBand";
import { CardRating } from "@/components/drama/CardRating";
import { DramaCard } from "@/components/drama/DramaCard";
import { GenreFilter } from "@/components/drama/GenreFilter";
import { KpopChartRail } from "@/components/drama/KpopChartRail";
import { trendingCards } from "@/components/drama/queries";
import { TrendingRail } from "@/components/drama/TrendingRail";
import { CrossRail } from "@/components/guide/CrossRail";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { dramaSlugs, dramaText, listDrama } from "@/data/drama";
import { genreOrder } from "@/lib/drama";
import { emptyTotals, getItemTotals } from "@/lib/item-votes";
import { breadcrumbLd, collectionLd, graph, itemListLd } from "@/lib/jsonld-catalog";
import { getKpopChart } from "@/lib/kpop-chart";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/drama">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Drama.hub" });
  const title = t("metaTitle", { count: dramaSlugs().length });
  const description = t("metaDescription");
  const path = "/drama";
  const alternates = guideAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 드라마 허브: 머리 → 지금 화제(랭킹 + 편집 추천 5) → 한국에서 지금 듣는 노래(KPOP_CHART=on 일 때만) →
// 작품 가이드 24(장르 칩, 별점) → 광고 → 다른 섹션 레일. 첫 화면 행동은 화제 카드의 하트
export default async function DramaHubPage({ params }: PageProps<"/[locale]/drama">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, dramas, text, chart] = await Promise.all([
    getTranslations("Drama.hub"),
    getTranslations("Guide"),
    getTranslations("Article"),
    listDrama(locale),
    dramaText(locale),
    getKpopChart(),
  ]);
  const [trending, totals] = await Promise.all([
    trendingCards(locale, dramas),
    getItemTotals(
      "drama",
      dramas.map((d) => d.slug),
    ),
  ]);

  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/drama`;
  const latest = dramas.reduce((max, d) => (d.addedAt > max ? d.addedAt : max), "");
  const updated = latest
    ? new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", month: "short", day: "numeric" }).format(
        new Date(`${latest}T00:00:00+09:00`),
      )
    : "";
  const genreName = (key: string) => text.genres[key] ?? key;

  return (
    <>
      <AppHeader title={t("title")} />
      <JsonLd
        data={graph(
          {
            ...collectionLd({ pageUrl, name: t("title"), description: t("metaDescription"), locale, parts: [] }),
            hasPart: undefined,
            mainEntity: { "@id": `${pageUrl}#list` },
          },
          itemListLd({
            pageUrl,
            name: t("listTitle"),
            items: dramas.map((d) => ({ name: d.text.title, url: `${pageUrl}/${d.slug}`, type: "TVSeries" })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: pageUrl },
          ]),
        )}
      />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={t("lead")} locale={locale} />
        </p>
        {updated && (
          <p className="mt-1 text-st12 tabular-nums text-ink-600">{t("stats", { count: dramas.length, date: updated })}</p>
        )}
      </div>

      <TrendingRail cards={trending} locale={locale} />
      <KpopChartRail chart={chart} locale={locale} />

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <section aria-labelledby="drama-list">
        <SectionHeader id="drama-list" title={t("listTitle")} count={dramas.length} />
        <GenreFilter
          genres={genreOrder(dramas).map((key) => ({ key, label: genreName(key) }))}
          items={dramas.map((d) => ({
            id: d.slug,
            genres: d.genres,
            node: (
              <DramaCard
                href={`/drama/${d.slug}`}
                title={d.text.title}
                glyph={String(d.episodes)}
                locale={locale}
                sub={`${d.year} · ${d.network}`}
                saveId={d.slug}
                meta={<CardRating totals={totals.get(d.slug) ?? emptyTotals("drama")} locale={locale} />}
              />
            ),
          }))}
        />
      </section>

      <AdBand label={tArticle("ad")} />
      <CrossRail from="drama" locale={locale} />
    </>
  );
}
