import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { Feed } from "@/components/Feed";
import { countLatest, listLatest } from "@/lib/articles";
import { PAGE_SIZE, pageCount, pagePath, pageSkip, parsePage, toFeedItems } from "@/lib/feed";
import { localeHomePath, ogBase } from "@/lib/url";

export const revalidate = 300;

// 쪽 번호 화면은 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다
export function generateStaticParams() {
  return [];
}

// 홈(1쪽) 다음 최신 글 20개씩. 크롤러가 홈의 '더 보기' 링크로 따라오는 주소다.
// 언어마다 글 수가 달라 같은 쪽 번호가 같은 글이 아니므로 hreflang 은 넣지 않는다
export async function generateMetadata({ params }: PageProps<"/[locale]/news/page/[n]">): Promise<Metadata> {
  const { locale, n } = await params;
  const page = parsePage(n);
  if (!page || page < 2) return {};
  const t = await getTranslations({ locale, namespace: "Feed" });
  const title = t("latestPageTitle", { n: page });
  const description = t("latestPageDescription", { n: page });
  const canonical = `${localeHomePath(locale)}${pagePath(page)}`;
  return {
    title,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
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

export default async function LatestPage({ params }: PageProps<"/[locale]/news/page/[n]">) {
  const { locale, n } = await params;
  setRequestLocale(locale);
  const page = parsePage(n);
  if (page === 1) permanentRedirect(localeHomePath(locale));
  if (!page) notFound();

  const [t, tHome, total, rows] = await Promise.all([
    getTranslations("Feed"),
    getTranslations("Home"),
    countLatest(locale),
    listLatest(locale, PAGE_SIZE, pageSkip(page)),
  ]);
  const lastPage = pageCount(total);
  if (page > lastPage || rows.length === 0) notFound();
  const items = await toFeedItems(rows, locale);

  return (
    <>
      <AppHeader title={tHome("latest")} />
      <CategoryRail />
      <div className="px-gutter pt-4">
        <h1 className="text-st2 font-bold text-ink-900">{tHome("latest")}</h1>
        <p className="mt-1 text-t6 tabular-nums text-ink-600">{t("pageOf", { n: page, total: lastPage })}</p>
      </div>
      <Feed items={items} lead={false} paging={{ locale, page, lastPage }} empty={null} />
    </>
  );
}
