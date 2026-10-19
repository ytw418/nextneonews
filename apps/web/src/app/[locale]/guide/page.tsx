import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { newBadgeShows } from "@/components/guide/badges";
import { coverGlyph } from "@/components/guide/glyph";
import { GuideCard } from "@/components/guide/GuideCard";
import { ItemRow } from "@/components/guide/ItemRow";
import { sectionCount } from "@/components/guide/sectionCount";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { featuredMix } from "@/data/catalog";
import { KIND_SECTION, SECTION_PATH, SECTION_TINT, SECTIONS } from "@/data/sections";
import type { CatalogSummary } from "@/data/types";
import { Link } from "@/i18n/navigation";
import { breadcrumbLd, collectionLd, graph } from "@/lib/jsonld-catalog";
import { localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

// '지금 인기' 줄 수와 테스트 뒤 '더 둘러보기' 레일 카드 수 (섹션을 번갈아 섞은 목록을 앞뒤로 나눠 쓴다)
const POPULAR = 6;
const MORE = 4;

export async function generateMetadata({ params }: PageProps<"/[locale]/guide">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Guide" });
  const alternates = localeAlternates(locale, "/guide");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    robots: pageRobots(true),
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

// 가이드 탭 (DESIGN.md §5): 섹션 타일 2×2(뷰티가 첫째) → 지금 인기(섹션을 번갈아 6개, 줄마다 저장) → 피부 타입 테스트 →
// 더 둘러보기 레일 → 광고 띠. 고를 것은 네 개뿐이다(결정 피로를 줄인다). 첫 화면에는 광고·테스트 없이 타일과 인기 첫 줄만,
// 광고는 테스트 버튼과 붙지 않게 사이에 레일 하나를 둔다. 카탈로그가 비면 그 블록은 건너뛴다
export default async function GuideHubPage({ params }: PageProps<"/[locale]/guide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tArticle, mix] = await Promise.all([
    getTranslations("Guide"),
    getTranslations("Article"),
    featuredMix(SECTIONS, locale, POPULAR + MORE),
  ]);
  const popular = mix.slice(0, POPULAR);
  const more = mix.slice(POPULAR);
  const popularNew = newBadgeShows(popular);
  const moreNew = newBadgeShows(more);
  const sections = SECTIONS.map((section) => ({ section, count: sectionCount(section) })).filter((s) => s.count > 0);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/guide`;
  const sectionTitle = (item: CatalogSummary) =>
    item.kind === "article" ? undefined : t(`sections.${KIND_SECTION[item.kind]}.title`);

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
            parts: sections.map(({ section }) => ({
              name: t(`sections.${section}.title`),
              url: `${home}${SECTION_PATH[section]}`,
            })),
          }),
          breadcrumbLd([
            { name: SITE_NAME, url: home },
            { name: t("title"), url: pageUrl },
          ]),
        )}
      />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("title")}</h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={t("intro")} locale={locale} />
        </p>
      </div>

      {/* 섹션 타일 2×2: 타이포 커버(이름 · 항목 수). 첫 화면에 '지금 인기' 첫 줄까지 들어오게 타일 밖 설명 줄은 두지 않는다 */}
      <TrackClicks event="guide_tile_open" from="guide">
        <ul className="grid grid-cols-2 gap-3 px-gutter pt-4">
          {sections.map(({ section, count }) => (
            <li key={section}>
              <Link href={SECTION_PATH[section]} className="press-soft block rounded-card">
                <TypeCover
                  variant="tile"
                  tint={SECTION_TINT[section]}
                  glyph={t(`sections.${section}.glyph`)}
                  title={t(`sections.${section}.title`)}
                  sub={t(`sections.${section}.count`, { count })}
                  locale={locale}
                />
              </Link>
            </li>
          ))}
        </ul>
      </TrackClicks>

      {popular.length > 0 && (
        <>
          <div aria-hidden className="mt-6 h-4 bg-band" />
          <section aria-labelledby="guide-popular">
            <SectionHeader id="guide-popular" title={t("popular")} />
            <ul>
              {popular.map((item) => {
                const section = sectionTitle(item);
                return (
                  <ItemRow
                    key={`${item.kind}:${item.id}`}
                    href={item.href}
                    cover={<TypeCover variant="square" tint={item.tint} glyph={coverGlyph(item)} className="size-14" />}
                    title={<Words text={item.title} locale={locale} />}
                    sub={
                      <>
                        {popularNew && item.badge === "new" && <span className="font-semibold text-brand-ink">{t("newBadge")} · </span>}
                        {[section, item.sub].filter(Boolean).join(" · ")}
                      </>
                    }
                    action={<SaveButton kind={item.kind} id={item.id} title={item.title} />}
                  />
                );
              })}
            </ul>
          </section>
        </>
      )}

      <div aria-hidden className="mt-6 h-4 bg-band" />
      {/* 피부 타입 테스트: 제휴 클릭으로 이어지는 유일한 테스트. 재미용이라고 먼저 말한다 */}
      <section aria-labelledby="guide-skin" className="px-gutter pt-6">
        <div className="rounded-card px-5 pt-5 pb-5" style={{ backgroundColor: SECTION_TINT.beauty }}>
          <h2 id="guide-skin" className="text-t4 font-bold text-on-tint">
            {t("skinCta.title")}
          </h2>
          <p className="mt-1 text-t6 text-on-tint-sub">
            <Words text={t("skinCta.body")} locale={locale} />
          </p>
          <Button size="l" variant="primary" block href="/beauty/skin-type" className="mt-4">
            {t("skinCta.button")}
          </Button>
        </div>
      </section>

      {/* 테스트 버튼과 광고 사이 콘텐츠 블록 하나 (광고가 버튼 바로 밑에 붙지 않게) */}
      {more.length > 0 && (
        <section aria-labelledby="guide-more">
          <SectionHeader id="guide-more" title={t("crossTitle")} />
          <TrackClicks event="cross_rail_click" from="guide">
            <ul className="rail rail-snap gap-3 px-gutter pb-3">
              {more.map((item) => (
                <li key={`${item.kind}:${item.id}`} className="w-36">
                  <GuideCard
                    item={item}
                    locale={locale}
                    label={sectionTitle(item)}
                    newLabel={moreNew ? t("newBadge") : undefined}
                  />
                </li>
              ))}
            </ul>
          </TrackClicks>
        </section>
      )}

      {/* 광고 띠 (DESIGN.md ⑫): 본문과 떨어진 크림 띠 안. 광고가 없거나 안 채워지면 띠째 접힌다 */}
      <div className="mt-6 bg-band py-2 empty:hidden [&:has([data-ad-blocked])]:hidden [&:has([data-ad-status=unfilled])]:hidden">
        <AdSlot
          label={tArticle("ad")}
          slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
        />
      </div>
    </>
  );
}
