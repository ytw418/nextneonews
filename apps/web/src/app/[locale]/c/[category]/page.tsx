import { categoryFromSlug, CATEGORIES, categorySlug, kstToday } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { EmptyMemo } from "@/components/EmptyMemo";
import { Feed } from "@/components/Feed";
import { JsonLd } from "@/components/JsonLd";
import { Button } from "@/components/ui/Button";
import { countByCategory, listByCategory, toFeedItems } from "@/lib/articles";
import { categoryTint } from "@/lib/cover";
import { FIRST_PAGE_SIZE, pageCount } from "@/lib/feed";
import { articlePath, localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

// 시간이 지나도 다시 만들지 않는다. 이 카테고리에 글을 낼 때 worker announce 가 비우고 바로 다시 요청한다
export const revalidate = false;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/c/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  const key = categoryFromSlug(category);
  if (!key) return {};
  const [t, count] = await Promise.all([
    getTranslations({ locale, namespace: "Feed" }),
    countByCategory(locale, key),
  ]);
  // 사람들이 검색하는 말로 ('Korea Travel Guide 2026: …'). 길면 사이트명을 붙이지 않는다 (검색 결과에서 잘리지 않게)
  const title = t(`title.${key}`, { year: kstToday().slice(0, 4) });
  const description = t(`intro.${key}`);
  const alternates = localeAlternates(locale, `/c/${category}`);
  return {
    title: title.length > 45 ? { absolute: title } : title,
    description,
    alternates,
    // 글이 하나도 없는 카테고리는 빈 화면이라 색인하지 않는다 (링크는 따라간다)
    robots: pageRobots(count > 0),
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

export default async function CategoryPage({ params }: PageProps<"/[locale]/c/[category]">) {
  const { locale, category } = await params;
  setRequestLocale(locale);
  const key = categoryFromSlug(category);
  if (!key) {
    notFound();
  }

  const [t, tHome, tCat, rows, total] = await Promise.all([
    getTranslations("Feed"),
    getTranslations("Home"),
    getTranslations("Category"),
    listByCategory(locale, key, FIRST_PAGE_SIZE),
    countByCategory(locale, key),
  ]);
  const items = await toFeedItems(rows, locale);
  const name = tCat(key);
  const intro = t(`intro.${key}`);
  const slug = categorySlug(key);
  const path = `${localeHomePath(locale)}/c/${slug}`;

  return (
    <>
      {/* 큰 제목이 바 밑으로 올라가면 가운데 제목. 뒤로 버튼 없는 root 화면이고, 탭바는 홈이 선택된 채로 둔다 */}
      <AppHeader title={name} />
      <CategoryRail active={key} />
      {/* 글 목록 구조화 데이터 (처음 20개). 검색엔진·AI 가 이 카테고리에 어떤 글이 있는지 바로 읽는다 */}
      {items.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "@id": `${SITE_URL}${path}#collection`,
            url: `${SITE_URL}${path}`,
            name,
            description: intro,
            inLanguage: locale,
            isPartOf: { "@id": `${SITE_URL}/#website` },
            mainEntity: {
              "@type": "ItemList",
              itemListOrder: "https://schema.org/ItemListOrderDescending",
              numberOfItems: Math.min(items.length, 20),
              itemListElement: items.slice(0, 20).map((item, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE_URL}${articlePath(locale, item.slug)}`,
                name: item.title,
              })),
            },
          }}
        />
      )}
      <div className="px-gutter pt-4">
        <h1 className="text-st2 font-bold text-ink-900">{name}</h1>
        <p className="mt-1 text-t6 text-ink-600">{intro}</p>
      </div>
      <div className="pt-3">
        <Feed
          items={items}
          showCategory={false}
          paging={{ locale, category: slug, page: 1, lastPage: pageCount(total) }}
          empty={
            <EmptyMemo text={tHome("empty")} tint={categoryTint(key)}>
              <Button size="m" variant="weak" href="/" className="bg-white/70! dark:bg-black/25!">
                {tHome("emptyCta")}
              </Button>
            </EmptyMemo>
          }
        />
      </div>
    </>
  );
}
