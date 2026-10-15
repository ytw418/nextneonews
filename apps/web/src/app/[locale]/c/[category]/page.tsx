import { categoryFromSlug, CATEGORIES, categorySlug } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { listByCategory } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";
import { localeAlternates, localeHomePath, ogBase } from "@/lib/url";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/c/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  const key = categoryFromSlug(category);
  if (!key) return {};
  const [t, tSite] = await Promise.all([
    getTranslations({ locale, namespace: "Category" }),
    getTranslations({ locale, namespace: "Site" }),
  ]);
  const description = tSite("categoryDescription", { category: t(key) });
  const alternates = localeAlternates(locale, `/c/${category}`);
  return {
    title: t(key),
    description,
    alternates,
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title: t(key),
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

  const [tHome, tCat, rows] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Category"),
    listByCategory(locale, key),
  ]);
  const items = await toFeedItems(rows, locale);

  return (
    <>
      <AppHeader />
      {/* 뒤로 버튼 없는 root 화면. 칩 레일이 나가는 길이고, 탭바는 홈이 선택된 채로 둔다 */}
      <CategoryRail active={key} />
      {/* 보이는 제목은 선택된(채운) 칩이 대신한다 */}
      <h1 className="sr-only">{tCat(key)}</h1>
      <div className="pt-3">
        <Feed
          items={items}
          showCategory={false}
          empty={{ label: tHome("empty"), ctaLabel: tHome("emptyCta"), ctaHref: "/" }}
        />
      </div>
    </>
  );
}
