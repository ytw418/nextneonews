import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { CrossRail } from "@/components/guide/CrossRail";
import { guidePrerender } from "@/components/guide/prerender";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { ShareButton } from "@/components/ShareButton";
import { AdBand } from "@/components/travel/AdBand";
import { AreaProgress } from "@/components/travel/AreaProgress";
import { AreaTile } from "@/components/travel/AreaTile";
import { Crumbs } from "@/components/travel/Crumbs";
import { PlaceRow } from "@/components/travel/PlaceRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { areaSlugs, getArea, listAreas, travelText } from "@/data/travel";
import { breadcrumbLd, graph, itemListLd } from "@/lib/jsonld-catalog";
import { areaGlyph, clip, keepAll, PREP_ROWS, prepBoxItems } from "@/lib/travel";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// DB 를 읽지 않는 정적 페이지: 색인 언어만 빌드 때 만들고 다른 언어는 처음 요청 때 만들어 배포까지 쓴다(components/guide/prerender).
// 없는 동네는 사이트 화면 안의 404
export const revalidate = false;

export function generateStaticParams() {
  return guidePrerender("area", areaSlugs());
}

export async function generateMetadata({ params }: PageProps<"/[locale]/travel/[area]">): Promise<Metadata> {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) return {};
  const area = await getArea(slug, locale);
  if (!area) return {};
  const t = await getTranslations({ locale, namespace: "Travel" });
  const title = t("area.metaTitle", { area: area.text.name });
  const description = clip(`${area.text.tagline}. ${area.text.intro}`);
  const path = `/travel/${area.slug}`;
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

// 동네: 이름·한 줄·소개 → 명소 4개(번호·종류·역·도장 표시·하트) → 내 도장 n/4 진행 →
// 여행 준비 작은 상자 → 다른 동네 레일 → 광고 → 다른 섹션 레일
export default async function TravelAreaPage({ params }: PageProps<"/[locale]/travel/[area]">) {
  const { locale, area: slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const area = await getArea(slug, locale);
  if (!area) notFound();
  const [t, tGuide, tArticle, text, areas] = await Promise.all([
    getTranslations("Travel"),
    getTranslations("Guide"),
    getTranslations("Article"),
    travelText(locale),
    listAreas(locale),
  ]);
  const name = area.text.name;
  const glyph = areaGlyph(area.slug, name, locale);
  const placeSlugs = area.places.map((p) => p.slug);
  const others = areas.filter((a) => a.slug !== area.slug);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/travel/${area.slug}`;

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/travel"
        title={name}
        action={<ShareButton title={name} label={t("area.share")} copiedLabel={tArticle("copied")} />}
      />
      <JsonLd
        data={graph(
          itemListLd({
            pageUrl,
            name: t("area.placesTitle", { area: name }),
            items: area.places.map((p) => ({
              name: p.text.name,
              url: `${home}/travel/place/${p.slug}`,
              type: "TouristAttraction",
            })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: `${home}/travel` },
            { name, url: pageUrl },
          ]),
        )}
      />

      <div className="px-gutter pt-2">
        <Crumbs
          label={t("breadcrumb")}
          items={[
            { name: tGuide("title"), href: "/guide" },
            { name: t("title"), href: "/travel" },
          ]}
        />
        <h1 className="text-st2 font-bold text-ink-900">
          <Words text={name} locale={locale} />
        </h1>
        <p className="mt-1 text-t5 font-semibold text-ink-700">
          <Words text={area.text.tagline} locale={locale} />
        </p>
        <p className={`mt-3 text-t6 text-ink-700 ${keepAll(locale)}`}>{area.text.intro}</p>
      </div>

      <section aria-labelledby="area-places">
        <SectionHeader id="area-places" title={t("area.placesTitle", { area: name })} count={area.places.length} />
        <ol>
          {area.places.map((place, i) => (
            <PlaceRow
              key={place.slug}
              slug={place.slug}
              name={place.text.name}
              sub={[
                t(`kinds.${place.kind}`),
                place.station &&
                  `${t("place.station", { station: place.station.name })} · ${t("place.walk", { min: place.station.walkMin })}`,
              ]
                .filter(Boolean)
                .join(" · ")}
              glyph={glyph}
              number={i + 1}
              locale={locale}
            />
          ))}
        </ol>
      </section>

      <section aria-labelledby="area-progress">
        <SectionHeader id="area-progress" title={t("area.progressTitle", { area: name })} />
        <AreaProgress area={area.slug} areaName={name} slugs={placeSlugs} />
      </section>

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <AffiliateBox
        compact
        title={text.prep.title}
        locale={locale}
        placement="travel-area"
        items={prepBoxItems(PREP_ROWS.area, text.prep.items, locale)}
      />

      {others.length > 0 && (
        <section aria-labelledby="area-others">
          <SectionHeader id="area-others" title={t("area.otherAreas")} href="/travel" linkLabel={t("place.seeArea")} />
          <ul className="rail gap-3 px-gutter pb-1">
            {others.map((other) => (
              <li key={other.slug} className="w-40">
                <AreaTile
                  slug={other.slug}
                  name={other.text.name}
                  count={t("spotCount", { count: other.places.length })}
                  glyph={areaGlyph(other.slug, other.text.name, locale)}
                  placeSlugs={other.places.map((p) => p.slug)}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <AdBand label={tArticle("ad")} />
      <CrossRail from="travel" locale={locale} />
    </>
  );
}
