import { categoryFromSlug, CATEGORIES, categorySlug } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { listByCategory } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";

export const revalidate = 300;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: categorySlug(c) }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/c/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  const key = categoryFromSlug(category);
  if (!key) return {};
  const t = await getTranslations({ locale, namespace: "Category" });
  return { title: t(key) };
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
      <CategoryRail active={key} />
      <h1 className="px-4 pb-2.5 pt-3 font-display text-[28px] italic">{tCat(key)}</h1>
      <Feed items={items} emptyLabel={tHome("empty")} />
    </>
  );
}
