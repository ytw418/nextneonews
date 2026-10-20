import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { newBadgeShows } from "@/components/guide/badges";
import { GuideCard } from "@/components/guide/GuideCard";
import { ItemRow } from "@/components/guide/ItemRow";
import { sectionCount } from "@/components/guide/sectionCount";
import { SectionTile } from "@/components/guide/SectionTile";
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
import { breadcrumbLd, collectionLd, graph } from "@/lib/jsonld-catalog";
import { guideAlternates, guideRobots } from "@/lib/guide-seo";
import { localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 카탈로그만 읽는 정적 페이지(DB 없음)라 다시 만들지 않는다. 바뀌면 배포가 새로 만든다
export const revalidate = false;

// '에디터 픽' 줄 수와 테스트 뒤 '더 둘러보기' 레일 카드 수 (섹션을 번갈아 섞은 목록을 앞뒤로 나눠 쓴다)
const POPULAR = 6;
const MORE = 4;

export async function generateMetadata({ params }: PageProps<"/[locale]/guide">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Guide" });
  const path = "/guide";
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

// 가이드 탭 (DESIGN.md §5): 섹션 타일 2×2(뷰티가 첫째) → 에디터 픽(섹션별 편집 점수순을 번갈아 6개, 줄마다 저장) → 피부 타입 테스트 →
// 더 둘러보기 레일 → 광고 띠. 고를 것은 네 개뿐이다(결정 피로를 줄인다). 첫 화면에는 광고·테스트 없이 타일과 에디터 픽 첫 줄(하트)까지,
// 광고는 테스트 버튼과 붙지 않게 사이에 레일 하나를 둔다. 카탈로그가 비면 그 블록은 건너뛴다.
// 목록은 조회·저장·투표 집계가 아니라 편집 점수순이라 '인기'라고 부르지 않는다 (DESIGN §7-12 숫자·신호는 실제 집계만)
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

      {/* 섹션 타일 2×2: 3D 아이콘 · 이름 · 항목 수. 낮은 2:1 이라 첫 화면(아이폰 664)에 에디터 픽 첫 줄과 하트까지 들어온다 */}
      <TrackClicks event="guide_tile_open" from="guide">
        <ul className="grid grid-cols-2 gap-3 px-gutter pt-5">
          {sections.map(({ section, count }) => (
            <li key={section}>
              <SectionTile
                href={SECTION_PATH[section]}
                title={t(`sections.${section}.title`)}
                sub={t(`sections.${section}.count`, { count })}
                section={section}
                locale={locale}
                className="aspect-[2/1]!"
              />
            </li>
          ))}
        </ul>
      </TrackClicks>

      {popular.length > 0 && (
        <>
          <div aria-hidden className="mt-6 h-4 bg-band" />
          <section aria-labelledby="guide-popular">
            <SectionHeader id="guide-popular" title={t("editorsPicks")} />
            <ul>
              {popular.map((item) => {
                const section = sectionTitle(item);
                return (
                  <ItemRow
                    key={`${item.kind}:${item.id}`}
                    href={item.href}
                    cover={<TypeCover variant="square" tint={item.tint} cover={item.cover} className="size-14" />}
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
