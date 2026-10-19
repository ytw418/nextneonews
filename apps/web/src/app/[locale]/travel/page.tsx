import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { CrossRail } from "@/components/guide/CrossRail";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { AdBand } from "@/components/travel/AdBand";
import { AreaTile } from "@/components/travel/AreaTile";
import { Crumbs } from "@/components/travel/Crumbs";
import { PlaceRow } from "@/components/travel/PlaceRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listAreas, travelText } from "@/data/travel";
import { breadcrumbLd, collectionLd, graph, itemListLd } from "@/lib/jsonld-catalog";
import { areaGlyph, PREP_ROWS, prepBoxItems, spotlightPlaces } from "@/lib/travel";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 카탈로그만 읽는 정적 페이지(DB 없음)라 다시 만들지 않는다. 바뀌면 배포가 새로 만든다
export const revalidate = false;

// 허브 아래 '촬영지·아이돌 성지' 줄 수 (여행 준비 상자와 광고 사이의 본문 한 덩어리)
const SPOTLIGHT = 6;

export async function generateMetadata({ params }: PageProps<"/[locale]/travel">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Travel" });
  const path = "/travel";
  const alternates = guideAlternates(locale, path);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 여행 허브: 동네 9 타일(첫 타일 넓게, 내 도장 n/4) → 여행 준비 제휴 상자(eSIM 첫 줄) → 촬영지·아이돌 성지 →
// 광고 → 다른 섹션 레일. 첫 화면은 타일뿐이다 (광고·제휴 없음)
export default async function TravelHubPage({ params }: PageProps<"/[locale]/travel">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, areas, text] = await Promise.all([
    getTranslations("Travel"),
    getTranslations("Guide"),
    getTranslations("Article"),
    listAreas(locale),
    travelText(locale),
  ]);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/travel`;
  const places = areas.flatMap((area) => area.places);
  const areaName = new Map(areas.map((a) => [a.slug, a.text.name]));
  const spotlight = spotlightPlaces(places, SPOTLIGHT);

  return (
    <>
      <AppHeader title={t("title")} />
      <JsonLd
        data={graph(
          collectionLd({
            pageUrl,
            name: t("metaTitle"),
            description: t("metaDescription"),
            locale,
            parts: areas.map((a) => ({ name: a.text.name, url: `${pageUrl}/${a.slug}` })),
          }),
          itemListLd({
            pageUrl,
            name: t("title"),
            items: areas.map((a) => ({ name: a.text.name, url: `${pageUrl}/${a.slug}` })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: pageUrl },
          ]),
        )}
      />

      <div className="px-gutter pt-4">
        <Crumbs label={t("breadcrumb")} items={[{ name: tGuide("title"), href: "/guide" }]} />
        <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={t("intro")} locale={locale} />
        </p>
        <p className="mt-1 text-st12 tabular-nums text-ink-600">
          {t("counts", { areas: areas.length, places: places.length })}
        </p>
      </div>

      <section aria-labelledby="travel-areas">
        <h2 id="travel-areas" className="sr-only">
          {t("areasTitle")}
        </h2>
        <TrackClicks event="guide_tile_open" from="travel">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-4 px-gutter pt-5">
            {areas.map((area, i) => (
              <li key={area.slug} className={i === 0 ? "col-span-2" : undefined}>
                <AreaTile
                  slug={area.slug}
                  name={area.text.name}
                  count={t("spotCount", { count: area.places.length })}
                  glyph={areaGlyph(area.slug, area.text.name, locale)}
                  placeSlugs={area.places.map((p) => p.slug)}
                  tagline={area.text.tagline}
                  wide={i === 0}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        </TrackClicks>
      </section>

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <AffiliateBox
        title={text.prep.title}
        locale={locale}
        placement="travel-prep"
        items={prepBoxItems(PREP_ROWS.hub, text.prep.items, locale)}
      />

      {spotlight.length > 0 && (
        <section aria-labelledby="travel-spotlight">
          <SectionHeader id="travel-spotlight" title={t("spotlightTitle")} />
          <ul>
            {spotlight.map((place) => (
              <PlaceRow
                key={place.slug}
                slug={place.slug}
                name={place.text.name}
                sub={`${t(`kinds.${place.kind}`)} · ${areaName.get(place.area) ?? ""}`}
                glyph={areaGlyph(place.area, areaName.get(place.area) ?? "", locale)}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      )}

      <AdBand label={tArticle("ad")} />
      <CrossRail from="travel" locale={locale} />
    </>
  );
}
