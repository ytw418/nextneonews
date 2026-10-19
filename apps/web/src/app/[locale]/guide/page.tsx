import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { kindIcon, SECTION_ICON } from "@/components/guide/icons";
import { TrackClicks } from "@/components/guide/TrackClicks";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { featuredMix } from "@/data/catalog";
import { SECTION_PATH, SECTION_TINT, SECTIONS } from "@/data/sections";
import { breadcrumbLd, collectionLd, graph } from "@/lib/jsonld-catalog";
import { localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

const POPULAR = 6;

export async function generateMetadata({ params }: PageProps<"/[locale]/guide">): Promise<Metadata> {
  const { locale } = await params;
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

// 가이드 탭: 섹션 4개(뷰티가 첫째) → 지금 인기(섹션을 번갈아 6개) → 피부 타입 테스트 → 광고.
// 고를 것은 네 개뿐이다 (결정 피로를 줄인다). 카탈로그가 비어 있으면 '지금 인기'는 건너뛴다
export default async function GuideHubPage({ params }: PageProps<"/[locale]/guide">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tArticle, popular] = await Promise.all([
    getTranslations("Guide"),
    getTranslations("Article"),
    featuredMix(SECTIONS, locale, POPULAR),
  ]);
  const home = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}`;
  const pageUrl = `${home}/guide`;

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
            parts: SECTIONS.map((s) => ({ name: t(`sections.${s}.title`), url: `${home}${SECTION_PATH[s]}` })),
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

      {/* 섹션 타일: 틴트 동그라미 글리프 · 이름 · 한 줄 · 꺾쇠 */}
      <TrackClicks event="guide_tile_open" from="guide" className="pt-3">
        <ul>
          {SECTIONS.map((section) => {
            const Icon = SECTION_ICON[section];
            return (
              <ListRow
                key={section}
                href={SECTION_PATH[section]}
                left={
                  <span
                    className="grid size-11 place-items-center rounded-full text-on-tint"
                    style={{ backgroundColor: SECTION_TINT[section] }}
                  >
                    <Icon className="size-6" />
                  </span>
                }
                title={t(`sections.${section}.title`)}
                sub={<Words text={t(`sections.${section}.line`)} locale={locale} />}
                arrow
              />
            );
          })}
        </ul>
      </TrackClicks>

      {popular.length > 0 && (
        <>
          <div aria-hidden className="mt-6 h-4 bg-band" />
          <section aria-labelledby="guide-popular">
            <SectionHeader id="guide-popular" title={t("popular")} />
            <ul>
              {popular.map((item) => {
                const Icon = kindIcon(item.kind);
                return (
                  <ListRow
                    key={`${item.kind}:${item.id}`}
                    href={item.href}
                    left={
                      <span
                        className="grid size-11 place-items-center rounded-btn-m text-on-tint"
                        style={{ backgroundColor: item.tint }}
                      >
                        <Icon className="size-5" />
                      </span>
                    }
                    title={<Words text={item.title} locale={locale} />}
                    sub={item.sub}
                    right={item.badge === "new" ? <Badge tone="brandWeak">{t("newBadge")}</Badge> : undefined}
                    arrow
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

      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
    </>
  );
}
