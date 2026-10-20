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
import { WatchList } from "@/components/drama/WatchList";
import { CrossRail } from "@/components/guide/CrossRail";
import { LiveTotals } from "@/components/guide/LiveTotals";
import { guidePrerender } from "@/components/guide/prerender";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { Badge } from "@/components/ui/Badge";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { type DramaEntry, dramaSlugs, dramaText, getDrama } from "@/data/drama";
import { catalogPerson } from "@/data/drama/people";
import { dramaCover } from "@/data/cover";
import { SECTION_TINT } from "@/data/sections";
import { getTravel, isTravelSlug, travelText } from "@/data/travel";
import { breadcrumbLd, graph, tvSeriesLd } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// DB 를 읽지 않는 정적 페이지: 카탈로그 24편을 색인 언어로만 빌드 때 만들고, 다른 언어는 처음 요청 때 만들어 배포까지 쓴다.
// 별점 집계는 브라우저가 받는다(DramaRating·CardRating). 없는 slug 는 사이트 화면 안의 404([locale]/not-found)
export const revalidate = false;

export function generateStaticParams() {
  return guidePrerender("slug", dramaSlugs());
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

  const [t, tHub, tGuide, tArticle, text, enText, koText, travel, places, similar] = await Promise.all([
    getTranslations("Drama.detail"),
    getTranslations("Drama.hub"),
    getTranslations("Guide"),
    getTranslations("Article"),
    dramaText(locale),
    dramaText("en"),
    dramaText("ko"),
    travelText(locale),
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
      cover={dramaCover(d)}
      locale={locale}
      sub={`${d.year} · ${d.network}`}
      saveId={d.slug}
      meta={<CardRating id={d.slug} />}
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
              const person = c.entityId ? catalogPerson(c.entityId, locale) : null;
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

      {/* 포스터 대신: 회색 면에 작품 상징 3D 아이콘(오른쪽)과 제목·연도·회차·방송사(왼쪽). 높이를 묶어 별점이 첫 화면에 들어온다 */}
      <TypeCover tint={SECTION_TINT.drama} cover={dramaCover(drama)} variant="hero" className="max-h-48 w-full">
        <div className="absolute inset-x-0 bottom-0 pr-32 pb-5 pl-gutter">
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

      <DramaRating itemId={drama.slug} />
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
      <CastList cast={drama.cast} locale={locale} />
      <FilmingList places={places} areaNames={areaNames} locale={locale} />
      {similar.length > 0 && (
        <section aria-labelledby="drama-similar">
          <SectionHeader id="drama-similar" title={t("similarTitle")} />
          <LiveTotals kind="drama" ids={similar.map((d) => d.slug)}>
            <ul className="rail rail-snap gap-3 px-gutter pb-1">
              {similar.map((d) => (
                <li key={d.slug}>{similarCard(d)}</li>
              ))}
            </ul>
          </LiveTotals>
        </section>
      )}

      <AdBand label={tArticle("ad")} />
      <CrossRail from="drama" locale={locale} />
    </>
  );
}
