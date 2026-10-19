import { isLocale, type Locale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { CrossRail } from "@/components/guide/CrossRail";
import { guidePrerender } from "@/components/guide/prerender";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { ClapperIcon, ExternalIcon, MicIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { AdBand } from "@/components/travel/AdBand";
import { CopyText } from "@/components/travel/CopyText";
import { Crumbs } from "@/components/travel/Crumbs";
import { PlaceRow } from "@/components/travel/PlaceRow";
import { StampButton } from "@/components/travel/StampButton";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { isKnownItem } from "@/data/catalog";
import { dramaText } from "@/data/drama";
import { catalogPerson } from "@/data/drama/people";
import { isNew, SECTION_TINT } from "@/data/sections";
import { getTravel, listTravel, travelSlugs, travelText } from "@/data/travel";
import type { Place } from "@/data/travel/types";
import { Link } from "@/i18n/navigation";
import { breadcrumbLd, graph, placeLd } from "@/lib/jsonld-catalog";
import { areaGlyph, clip, keepAll, naverMapUrl, placePrepTargets } from "@/lib/travel";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// DB 를 읽지 않는 정적 페이지: 색인 언어만 빌드 때 만들고 다른 언어는 처음 요청 때 만들어 배포까지 쓴다(components/guide/prerender).
// 없는 명소는 사이트 화면 안의 404
export const revalidate = false;

export function generateStaticParams() {
  return guidePrerender("slug", travelSlugs());
}

// generateMetadata 와 본문이 같은 요청에서 한 번만 읽는다
const loadPlace = cache(async (slug: string, locale: Locale) => {
  const [place, text] = await Promise.all([getTravel(slug, locale), travelText(locale)]);
  return place ? { place, areaName: text.areas[place.area].name, text } : null;
});

// 관련 드라마: 드라마 카탈로그에 있는 것만 (제목도 거기서). 없는 slug 는 보일 이름이 없어 뺀다
async function relatedDramas(place: Place, locale: Locale) {
  const ids = (place.related?.dramas ?? []).filter((id) => isKnownItem("drama", id));
  if (ids.length === 0) return [];
  const { dramas } = await dramaText(locale);
  return ids.flatMap((id) => (dramas[id] ? [{ id, title: dramas[id].title }] : []));
}

// 관련 인물: 인물 사전 사본(data/drama/people)에 있는 사람만 이름을 보이고, 인물 페이지 slug 가 있을 때만 링크 (DB 를 읽지 않는다)
function relatedPeople(place: Place, locale: Locale) {
  return (place.related?.entityIds ?? []).flatMap((id) => {
    const person = catalogPerson(id, locale);
    return person ? [{ id, ...person }] : [];
  });
}

export async function generateMetadata({ params }: PageProps<"/[locale]/travel/place/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const loaded = await loadPlace(slug, locale);
  if (!loaded) return {};
  const { place, areaName } = loaded;
  const t = await getTranslations({ locale, namespace: "Travel" });
  const title = t("place.metaTitle", { place: place.text.name, area: areaName });
  const description = clip(place.text.summary);
  const path = `/travel/place/${place.slug}`;
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

// 명소 (위→아래): 커버 → 이름 → 가까운 역 → 구글·네이버 지도 → 택시 기사에게 보여 줄 한국어 주소 →
// '가 봤어요' 도장 (첫 화면 행동) → 요약 → 관련 드라마·인물 → 주소·한국어 주소 복사·운영 시간 → 팁 → 여행 준비 작은 상자 →
// 같은 동네 다른 명소 → 광고 → 다른 섹션 레일. 광고는 도장·상자와 콘텐츠 한 덩어리 이상 떨어져 있다
export default async function TravelPlacePage({ params }: PageProps<"/[locale]/travel/place/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const loaded = await loadPlace(slug, locale);
  if (!loaded) notFound();
  const { place, areaName, text } = loaded;
  const people = relatedPeople(place, locale);
  const [t, tGuide, tArticle, ko, all, dramas] = await Promise.all([
    getTranslations("Travel"),
    getTranslations("Guide"),
    getTranslations("Article"),
    // 택시 기사에게 보여 줄 한국어 이름·주소와 네이버 지도 검색어 (요청 언어 파일과 함께 서버에서 읽는다)
    travelText("ko"),
    listTravel(locale),
    relatedDramas(place, locale),
  ]);

  const name = place.text.name;
  const koName = ko.places[place.slug]?.name ?? name;
  const koAddress = ko.places[place.slug]?.address ?? place.text.address;
  const glyph = areaGlyph(place.area, areaName, locale);
  const areaPlaces = all.filter((p) => p.area === place.area);
  const others = areaPlaces.filter((p) => p.slug !== place.slug);
  const prep = placePrepTargets(locale);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/travel/place/${place.slug}`;
  const newTab = <span className="sr-only">{t("place.newTab")}</span>;
  const wrap = keepAll(locale);
  const chip = "inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-t6 font-semibold";

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref={`/travel/${place.area}`}
        title={name}
        action={
          <>
            <SaveButton kind="place" id={place.slug} title={name} />
            <ShareButton title={name} label={t("place.share")} copiedLabel={tArticle("copied")} />
          </>
        }
      />
      <JsonLd
        data={graph(
          placeLd({
            url: pageUrl,
            name,
            description: place.text.summary,
            address: place.text.address,
            geo: { lat: place.lat, lng: place.lng },
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: tGuide("title"), url: `${home}/guide` },
            { name: t("title"), url: `${home}/travel` },
            { name: areaName, url: `${home}/travel/${place.area}` },
            { name, url: pageUrl },
          ]),
        )}
      />

      {/* 사진이 없는 커버라 4:3 대신 2:1 — 도장 버튼이 첫 화면(아이폰 15)에 들어오게 */}
      <TypeCover
        tint={SECTION_TINT.travel}
        glyph={glyph}
        variant="hero"
        label={t(`kinds.${place.kind}`)}
        isNew={isNew(place.addedAt)}
        newLabel={t("newBadge")}
        className="aspect-[2/1]!"
      />

      <div className="px-gutter pt-3">
        <Crumbs
          label={t("breadcrumb")}
          items={[
            { name: t("title"), href: "/travel" },
            { name: areaName, href: `/travel/${place.area}` },
          ]}
        />
        <h1 className="text-t3 font-bold text-ink-900">
          <Words text={name} locale={locale} />
        </h1>
      </div>

      {place.station && (
        <ul className="pt-1">
          <ListRow
            title={`${t("place.station", { station: place.station.name })} · ${t("place.walk", { min: place.station.walkMin })}`}
            sub={`${t("place.nearestStation")} · ${place.station.line}`}
          />
        </ul>
      )}

      <div className={`flex gap-2 px-gutter ${place.station ? "" : "pt-3"}`}>
        <Button size="l" variant="neutral" href={place.mapUrl} external className="flex-1">
          {t("place.googleMap")}
          <ExternalIcon className="size-4 shrink-0" />
          {newTab}
        </Button>
        <Button size="l" variant="neutral" href={naverMapUrl(koName)} external className="flex-1">
          {t("place.naverMap")}
          <ExternalIcon className="size-4 shrink-0" />
          {newTab}
        </Button>
      </div>
      {/* 택시 기사에게 그대로 보여 줄 한국어 주소 한 줄 (한국어 화면은 아래 주소가 이미 한국어) */}
      {locale !== "ko" && (
        <div className="mx-gutter mt-3 rounded-card bg-card px-4 py-3 shadow-card">
          <p className="text-st12 font-semibold text-ink-600">{t("place.taxiTitle")}</p>
          <p lang="ko" className="mt-0.5 text-t5 font-bold text-ink-900 [word-break:keep-all]">
            {koAddress}
          </p>
        </div>
      )}
      <div className="px-gutter pt-3">
        <StampButton slug={place.slug} areaName={areaName} areaSlugs={areaPlaces.map((p) => p.slug)} />
      </div>
      <p className={`px-gutter pt-4 text-t6 text-ink-700 ${wrap}`}>{place.text.summary}</p>

      {dramas.length + people.length > 0 && (
        <section aria-labelledby="place-related">
          <SectionHeader id="place-related" title={t("place.relatedTitle")} />
          <ul className="flex flex-wrap gap-2 px-gutter">
            {dramas.map((drama) => (
              <li key={drama.id}>
                <Link href={`/drama/${drama.id}`} className={`press hit bg-card text-ink-700 shadow-card ${chip}`}>
                  <ClapperIcon className="size-4 shrink-0 text-ink-400" />
                  {drama.title}
                </Link>
              </li>
            ))}
            {people.map((person) => (
              <li key={person.id}>
                {person.slug ? (
                  <Link href={`/idol/${person.slug}`} className={`press hit bg-card text-ink-700 shadow-card ${chip}`}>
                    <MicIcon className="size-4 shrink-0 text-ink-400" />
                    {person.name}
                  </Link>
                ) : (
                  // 인물 페이지가 없는 사람은 글자만 (누를 수 있어 보이지 않게 그림자·눌림 없음)
                  <span className={`bg-fill-weak text-ink-600 ${chip}`}>{person.name}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <section aria-labelledby="place-address">
        <SectionHeader id="place-address" title={t("place.addressTitle")} />
        <p className={`px-gutter text-t5 text-ink-900 ${wrap}`}>{place.text.address}</p>
        {locale !== "ko" && (
          // 카카오T·택시 앱에 붙여 넣을 한국어 이름·주소
          <div className="px-gutter pt-3">
            <p lang="ko" className="text-t6 text-ink-700 [word-break:keep-all]">
              {koName} · {koAddress}
            </p>
            <CopyText
              text={`${koName} ${koAddress}`}
              label={t("place.copyAddress")}
              done={t("place.addressCopied")}
              className="mt-2"
            />
          </div>
        )}
        {place.hours && (
          <div className="px-gutter pt-5">
            <h3 className="text-t6 font-bold text-ink-900">{t("place.hours")}</h3>
            <p lang="en" className="mt-1 text-t6 text-ink-700">
              {place.hours}
            </p>
            <p className={`mt-1 text-st12 text-ink-600 ${wrap}`}>{t("place.hoursNote")}</p>
          </div>
        )}
      </section>

      <section aria-labelledby="place-tips">
        <SectionHeader id="place-tips" title={t("place.tipsTitle")} />
        <ul className="flex flex-col gap-3 px-gutter">
          {place.text.tips.map((tip) => (
            <li key={tip} className={`flex gap-3 text-t6 text-ink-700 ${wrap}`}>
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="min-w-0 flex-1">{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <AffiliateBox
        compact
        title={text.prep.title}
        locale={locale}
        placement="travel-place"
        items={[
          { target: prep.esim, label: text.prep.items.esim.label, itemId: "esim" },
          { target: prep.airportTour, label: t("place.airportTour"), itemId: "airport-tour" },
        ]}
      />

      {others.length > 0 && (
        <section aria-labelledby="place-more">
          <SectionHeader
            id="place-more"
            title={t("place.moreInArea", { area: areaName })}
            href={`/travel/${place.area}`}
            linkLabel={t("place.seeArea")}
          />
          <ul>
            {others.map((other) => (
              <PlaceRow
                key={other.slug}
                slug={other.slug}
                name={other.text.name}
                sub={t(`kinds.${other.kind}`)}
                glyph={glyph}
                number={areaPlaces.indexOf(other) + 1}
                locale={locale}
              />
            ))}
          </ul>
        </section>
      )}

      <AdBand label={tArticle("ad")} />
      <CrossRail from="travel" locale={locale} exclude={place.slug} />
    </>
  );
}
