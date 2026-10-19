import { categoryFromSlug, categorySlug } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { countByCategory, listByCategory, toFeedItems } from "@/lib/articles";
import { PAGE_SIZE, pageCount, pagePath, pageSkip, parsePage } from "@/lib/feed";
import { localeHomePath, ogBase, pageRobots } from "@/lib/url";

export const revalidate = 300;

// 쪽 번호 화면은 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다
export function generateStaticParams() {
  return [];
}

// 카테고리 첫 화면(1쪽) 다음 글 20개씩. /news/page/n 과 같은 규칙 (hreflang 없음, canonical 은 자기 자신)
export async function generateMetadata({ params }: PageProps<"/[locale]/c/[category]/page/[n]">): Promise<Metadata> {
  const { locale, category, n } = await params;
  const key = categoryFromSlug(category);
  const page = parsePage(n);
  if (!key || !page || page < 2) return {};
  const [t, tCat] = await Promise.all([
    getTranslations({ locale, namespace: "Feed" }),
    getTranslations({ locale, namespace: "Category" }),
  ]);
  const title = t("categoryPageTitle", { category: tCat(key), n: page });
  const description = t(`intro.${key}`);
  const canonical = `${localeHomePath(locale)}${pagePath(page, categorySlug(key))}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: pageRobots(),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function CategoryPageN({ params }: PageProps<"/[locale]/c/[category]/page/[n]">) {
  const { locale, category, n } = await params;
  setRequestLocale(locale);
  const key = categoryFromSlug(category);
  if (!key) notFound();
  const page = parsePage(n);
  const slug = categorySlug(key);
  if (page === 1) permanentRedirect(`${localeHomePath(locale)}${pagePath(1, slug)}`);
  if (!page) notFound();

  const [t, tCat, total, rows] = await Promise.all([
    getTranslations("Feed"),
    getTranslations("Category"),
    countByCategory(locale, key),
    listByCategory(locale, key, PAGE_SIZE, pageSkip(page)),
  ]);
  const lastPage = pageCount(total);
  if (page > lastPage || rows.length === 0) notFound();
  const items = await toFeedItems(rows, locale);
  const name = tCat(key);

  return (
    <>
      <AppHeader title={name} />
      <CategoryRail active={key} />
      <div className="px-gutter pt-4">
        <h1 className="text-st2 font-bold text-ink-900">{name}</h1>
        <p className="mt-1 text-t6 tabular-nums text-ink-600">{t("pageOf", { n: page, total: lastPage })}</p>
      </div>
      <Feed
        items={items}
        lead={false}
        showCategory={false}
        paging={{ locale, category: slug, page, lastPage }}
        empty={null}
      />
    </>
  );
}
