import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { AdBand } from "@/components/drama/AdBand";
import { CardRating } from "@/components/drama/CardRating";
import { CastList } from "@/components/drama/CastList";
import { DramaCard } from "@/components/drama/DramaCard";
import { DramaRating } from "@/components/drama/DramaRating";
import { FilmingList } from "@/components/drama/FilmingList";
import { castPeople } from "@/components/drama/queries";
import { WatchList } from "@/components/drama/WatchList";
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type DramaEntry, dramaSlugs, dramaText, getDrama } from "@/data/drama";
import { SECTION_TINT } from "@/data/sections";
import { getTravel, isTravelSlug, travelText } from "@/data/travel";
import { emptyTotals, getItemTotals } from "@/lib/item-votes";
import { breadcrumbLd, graph, tvSeriesLd } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 카탈로그 24편만 빌드 때 만든다. 별점 집계가 바뀌므로 한 시간마다 다시 만든다
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return dramaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/drama/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const drama = await getDrama(slug, locale);
  if (!drama) return {};
  const t = await getTranslations({ locale, namespace: "Drama.detail" });
  const title = t("metaTitle", { title: drama.text.title, year: drama.year });
  const description = t("metaDescription", { tagline: drama.text.tagline });
  const path = `/drama/${slug}`;
  const alternates = guideAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    robots: guideRobots(locale, path),
    openGraph: {
      ...ogBase(locale),
      type: "video.tv_show",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

function present<T>(value: T | null): value is T {
  return value !== null;
}

// 드라마 상세 (DESIGN §5): 히어로 커버 → 제목·연도·회차·방송사·장르 → 한 줄 → 별점 → 어디서 보나 →
// 줄거리 → 이래서 봐요 → 출연 → 촬영지 → 비슷한 작품 → 광고 → 다른 섹션 레일. 첫 화면 행동은 별점
export default async function DramaPage({ params }: PageProps<"/[locale]/drama/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const drama = await getDrama(slug, locale);
  if (!drama) notFound();

  const castIds = [...new Set(drama.cast.flatMap((c) => (c.entityId ? [c.entityId] : [])))].sort().join(",");
  const [t, tHub, tGuide, tArticle, text, enText, koText, travel, totals, people, places, similar] = await Promise.all([
    getTranslations("Drama.detail"),
    getTranslations("Drama.hub"),
    getTranslations("Guide"),
    getTranslations("Article"),
    dramaText(locale),
    dramaText("en"),
    dramaText("ko"),
    travelText(locale),
    getItemTotals("drama", [drama.slug, ...drama.similar]),
    castPeople(castIds, locale),
    Promise.all(drama.filmingPlaces.filter(isTravelSlug).map((s) => getTravel(s, locale))).then((list) => list.filter(present)),
    Promise.all(drama.similar.map((s) => getDrama(s, locale))).then((list) => list.filter(present)),
  ]);

  const title = drama.text.title;
  const genreName = (key: string) => text.genres[key] ?? key;
  const episodes = t("episodes", { count: drama.episodes });
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/drama/${drama.slug}`;
  const alternateName = [...new Set([enText.dramas[slug]?.title, koText.dramas[slug]?.title])].filter(
    (name): name is string => !!name && name !== title,
  );
  const areaNames = Object.fromEntries(Object.entries(travel.areas).map(([area, a]) => [area, a.name]));
  const similarCard = (d: DramaEntry) => (
    <DramaCard
      href={`/drama/${d.slug}`}
      title={d.text.title}
      glyph={String(d.episodes)}
      locale={locale}
      sub={`${d.year} · ${d.network}`}
      saveId={d.slug}
      meta={<CardRating totals={totals.get(d.slug) ?? emptyTotals("drama")} locale={locale} />}
      className="w-36"
    />
  );

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/drama"
        title={title}
        action={
          <>
            <SaveButton kind="drama" id={drama.slug} title={title} />
            <ShareButton title={title} label={t("share")} copiedLabel={tArticle("copied")} />
          </>
        }
      />
      <JsonLd
        data={graph(
          tvSeriesLd({
            url: pageUrl,
            name: title,
            alternateName,
            description: drama.text.synopsis,
            startDate: String(drama.year),
            numberOfEpisodes: drama.episodes,
            actors: drama.cast.map((c) => {
              const person = c.entityId ? people.get(c.entityId) : undefined;
              return { name: person?.name ?? c.name, url: person?.slug ? `${home}/idol/${person.slug}` : undefined };
            }),
            sameAs: drama.wikidataId ? [`https://www.wikidata.org/wiki/${drama.wikidataId}`] : [],
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: tHub("title"), url: `${home}/drama` },
            { name: title, url: pageUrl },
          ]),
        )}
      />

      {/* 포스터처럼: 틴트 면에 제목·연도·회차·방송사, 오른쪽 아래로 잘린 회차 숫자. 높이를 묶어 별점이 첫 화면에 들어온다 */}
      <TypeCover tint={SECTION_TINT.drama} glyph={String(drama.episodes)} variant="hero" className="max-h-48 w-full">
        <div className="absolute inset-x-0 bottom-0 px-gutter pb-5">
          <h1 className="title text-t3 font-bold">
            <Words text={title} locale={locale} />
          </h1>
          <p className="mt-1 text-t6 font-semibold tabular-nums text-on-tint-sub">
            <Meta parts={[String(drama.year), episodes, drama.network]} />
          </p>
        </div>
      </TypeCover>

      <div className="px-gutter pt-4">
        <ul className="flex flex-wrap gap-1.5">
          {drama.genres.map((g) => (
            <li key={g}>
              <Badge tone="neutral">{genreName(g)}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-t5 text-ink-700">
          <Words text={drama.text.tagline} locale={locale} />
        </p>
      </div>

      <DramaRating itemId={drama.slug} initial={totals.get(drama.slug) ?? emptyTotals("drama")} />
      <WatchList watch={drama.watch} locale={locale} />

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <section aria-labelledby="drama-story">
        <SectionHeader id="drama-story" title={t("storyTitle")} />
        <p className="px-gutter text-t5 text-ink-900">{drama.text.synopsis}</p>
      </section>
      <section aria-labelledby="drama-why">
        <SectionHeader id="drama-why" title={t("whyTitle")} />
        <ol className="flex flex-col gap-3 px-gutter">
          {drama.text.whyWatch.map((line, i) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden className="w-4 shrink-0 text-t5 font-bold tabular-nums text-brand-ink">
                {i + 1}
              </span>
              <span className="text-t5 text-ink-900">{line}</span>
            </li>
          ))}
        </ol>
      </section>

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <CastList cast={drama.cast} people={people} locale={locale} />
      <FilmingList places={places} areaNames={areaNames} locale={locale} />
      {similar.length > 0 && (
        <section aria-labelledby="drama-similar">
          <SectionHeader id="drama-similar" title={t("similarTitle")} />
          <ul className="rail rail-snap gap-3 px-gutter pb-1">
            {similar.map((d) => (
              <li key={d.slug}>{similarCard(d)}</li>
            ))}
          </ul>
        </section>
      )}

      <AdBand label={tArticle("ad")} />
      <CrossRail from="drama" locale={locale} />
    </>
  );
}
