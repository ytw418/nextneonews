import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { CategoryChips } from "@/components/beauty/CategoryChips";
import { MethodNote } from "@/components/beauty/MethodNote";
import { ProductCard } from "@/components/beauty/ProductCard";
import { RankHero } from "@/components/beauty/RankHero";
import { SkinTypeChip } from "@/components/beauty/SkinTypeChip";
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { BEAUTY_CATEGORIES } from "@/data/beauty/types";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { type AffiliateTarget, PARTNER_NAME, partnersForLocale } from "@/lib/affiliate";
import { updatedDate } from "@/lib/beauty";
import { breadcrumbLd, collectionLd, graph, itemListLd } from "@/lib/jsonld-catalog";

import { loadBeauty } from "./data";
import { absoluteUrl, beautyCrumbs, beautyMetadata } from "./meta";

// 정적: 다시 그리기는 파이프라인의 하루 1번 무효화만 (./data.ts). 9개 언어 모두 빌드 때 만든다 (빌드는 DB 를 읽지 않는다)
export const revalidate = false;

// 허브 '어디서 사나': 제품이 아니라 가게 자체로 (검색·목록 주소). 순서는 언어별 partnersForLocale
const HUB_SHOPS: AffiliateTarget[] = [
  { partner: "oliveyoung", url: "https://global.oliveyoung.com/" },
  { partner: "yesstyle", url: "https://www.yesstyle.com/en/list.html?q=k-beauty" },
  { partner: "amazon", url: "https://www.amazon.com/s?k=korean+skincare" },
];

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Beauty" });
  return beautyMetadata({ locale, path: "/beauty", title: t("metaTitle"), description: t("metaDescription") });
}

// 뷰티 허브: 머리(피부 타입 칩·분류 칩) → 분류별 대표 (가장 점수 높은 것을 전폭, 나머지 2열 + 테스트 타일).
// 순위 숫자는 쓰지 않는다 — 분류마다 하나씩이라 큰 '1' 이 전체 1위로 읽혔다. 카드마다 분류 이름이 먼저 온다
// → 어디서 사나 → 산식 공개 → 다른 섹션 레일 → 광고(맨 아래, 구매 상자와 한 화면 이상 떨어뜨린다)
export default async function BeautyHubPage({ params }: PageProps<"/[locale]/beauty">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, data] = await Promise.all([
    getTranslations("Beauty"),
    getTranslations("Guide"),
    getTranslations("Article"),
    loadBeauty(locale),
  ]);
  const names = Object.fromEntries(BEAUTY_CATEGORIES.map((c) => [c, data.text.categories[c].name])) as Record<
    (typeof BEAUTY_CATEGORIES)[number],
    string
  >;
  const winners = BEAUTY_CATEGORIES.flatMap((category) => {
    const top = data.ranked.get(category)?.[0];
    return top ? [{ category, ...top }] : [];
  });
  const hero = winners.toSorted((a, b) => b.score - a.score)[0];
  const others = winners.filter((w) => w !== hero);
  const shops = partnersForLocale(locale, HUB_SHOPS).map((target) => ({
    target,
    label: PARTNER_NAME[target.partner],
    sub: t(`ship.${target.partner}`),
  }));
  const pageUrl = absoluteUrl(locale, "/beauty");

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
            parts: BEAUTY_CATEGORIES.map((c) => ({ name: names[c], url: absoluteUrl(locale, `/beauty/awards/${c}`) })),
          }),
          itemListLd({
            pageUrl,
            name: t("winnersTitle"),
            items: winners.map((w) => ({
              name: `${w.item.brand} ${w.item.text.name}`,
              url: absoluteUrl(locale, `/beauty/p/${w.item.slug}`),
              type: "Product",
            })),
          }),
          breadcrumbLd(beautyCrumbs(locale, tGuide("title"), t("title"))),
        )}
      />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
        <SkinTypeChip />
        <p className="mt-3 text-t6 text-ink-600">
          <Words text={t("intro")} locale={locale} />
        </p>
      </div>
      <div className="pt-2">
        <CategoryChips label={t("categoriesLabel")} names={names} />
      </div>

      {hero && (
        <section aria-labelledby="beauty-winners">
          <SectionHeader id="beauty-winners" title={t("winnersTitle")} />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-gutter">
            <RankHero
              entry={hero.item}
              locale={locale}
              label={names[hero.category]}
              basis={
                data.withVotes
                  ? t("basis", { count: data.votes.get(hero.category) ?? 0, date: updatedDate(locale) })
                  : t("basisEditorial", { date: updatedDate(locale) })
              }
            />
            {others.map((w) => (
              <ProductCard key={w.item.slug} entry={w.item} locale={locale} lead={names[w.category]} />
            ))}
            <li>
              <Link href="/beauty/skin-type" className="press-soft block">
                <span className="mb-1.5 block truncate pl-1 text-t5 font-bold text-ink-900">{t("tile.label")}</span>
                <TypeCover
                  tint={SECTION_TINT.beauty}
                  glyph="6"
                  variant="tile"
                  title={t("tile.title")}
                  sub={t("tile.sub")}
                  locale={locale}
                />
              </Link>
            </li>
          </ul>
        </section>
      )}

      <div aria-hidden className="mt-8 h-4 bg-band" />
      <AffiliateBox title={t("buy.hubTitle")} locale={locale} placement="beauty-hub" items={shops} />

      <MethodNote locale={locale} />

      <div aria-hidden className="mt-8 h-4 bg-band" />
      <CrossRail from="beauty" locale={locale} />
      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
    </>
  );
}
