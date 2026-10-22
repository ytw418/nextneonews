import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { CategoryChips } from "@/components/beauty/CategoryChips";
import { Crumbs } from "@/components/beauty/Crumbs";
import { MethodNote } from "@/components/beauty/MethodNote";
import { ProductCard } from "@/components/beauty/ProductCard";
import { RankHero } from "@/components/beauty/RankHero";
import { RankRow } from "@/components/beauty/RankRow";
import { CrossRail } from "@/components/guide/CrossRail";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { BEAUTY_CATEGORIES, type BeautyCategory } from "@/data/beauty/types";
import { isEditorsPick, updatedDate } from "@/lib/beauty";
import { breadcrumbLd, graph, itemListLd } from "@/lib/jsonld-catalog";

import { loadBeauty, staticParamsFor } from "../../data";
import { absoluteUrl, beautyCrumbs, beautyMetadata } from "../../meta";

// 정적: 다시 그리기는 파이프라인의 하루 1번 무효화만 (../../data.ts). 색인 언어 밖은 첫 요청 때 만들고, 없는 분류는 notFound
export const revalidate = false;

// 비대칭 랭킹: 1위 전폭 · 2·3위 2열 · 4위부터 목록
const GRID_UNTIL = 3;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return staticParamsFor(params.locale, "category", BEAUTY_CATEGORIES);
}

function isCategory(value: string): value is BeautyCategory {
  return (BEAUTY_CATEGORIES as readonly string[]).includes(value);
}

// 분류 이름 + '어워드' 또는 (표 30 미만이면) '에디터 픽'
async function heading(locale: string, category: BeautyCategory) {
  if (!isLocale(locale)) return null;
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "Beauty" }), loadBeauty(locale)]);
  const votes = data.votes.get(category) ?? 0;
  const kind = isEditorsPick(votes) ? t("editorsPicks") : t("awardsName");
  return { t, data, votes, name: data.text.categories[category].name, kind };
}

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty/awards/[category]">): Promise<Metadata> {
  const { locale, category } = await params;
  if (!isCategory(category)) return {};
  const h = await heading(locale, category);
  if (!h) return {};
  return beautyMetadata({
    locale,
    path: `/beauty/awards/${category}`,
    title: h.t("awards.metaTitle", { category: h.name, kind: h.kind }),
    description: h.t("awards.metaDescription", { category: h.name, intro: h.data.text.categories[category].intro }),
  });
}

// 분류 어워드: h1(분류 · 어워드|에디터 픽) → 분류 소개 → 분류 칩 → 1위 카드 → 2·3위 → 4위~ 목록 → 산식 설명(한국 정가 포함) → 광고 → 다른 섹션
export default async function BeautyAwardsPage({ params }: PageProps<"/[locale]/beauty/awards/[category]">) {
  const { locale, category } = await params;
  if (!isLocale(locale) || !isCategory(category)) notFound();
  setRequestLocale(locale);

  const [h, tGuide, tArticle] = await Promise.all([
    heading(locale, category),
    getTranslations("Guide"),
    getTranslations("Article"),
  ]);
  if (!h) notFound();
  const { t, data, votes, name, kind } = h;
  const ranked = data.ranked.get(category) ?? [];
  if (ranked.length === 0) notFound();
  const names = Object.fromEntries(BEAUTY_CATEGORIES.map((c) => [c, data.text.categories[c].name])) as Record<
    BeautyCategory,
    string
  >;
  const title = t("awards.title", { category: name, kind });
  const basis = data.withVotes
    ? t("basis", { count: votes, date: updatedDate(locale) })
    : t("basisEditorial", { date: updatedDate(locale) });
  const pageUrl = absoluteUrl(locale, `/beauty/awards/${category}`);
  const [first, ...rest] = ranked;
  const grid = rest.slice(0, GRID_UNTIL - 1);
  const rows = rest.slice(GRID_UNTIL - 1);

  return (
    <>
      <AppHeader variant="pushed" parentHref="/beauty" title={title} />
      <JsonLd
        data={graph(
          itemListLd({
            pageUrl,
            name: title,
            items: ranked.map((r) => ({
              name: `${r.item.brand} ${r.item.text.name}`,
              url: absoluteUrl(locale, `/beauty/p/${r.item.slug}`),
            })),
          }),
          breadcrumbLd(beautyCrumbs(locale, tGuide("title"), t("title"), [{ name: title, url: pageUrl }])),
        )}
      />

      <Crumbs label={t("crumbsLabel")} items={[{ name: t("title"), href: "/beauty" }, { name }]} />
      <div className="px-gutter pt-2">
        <h1 className="text-st2 font-bold text-ink-900">
          <Words text={title} locale={locale} />
        </h1>
        <p className="mt-1 text-t6 text-ink-600">
          <Words text={data.text.categories[category].intro} locale={locale} />
        </p>
      </div>
      <div className="pt-3">
        <CategoryChips label={t("categoriesLabel")} names={names} active={category} />
      </div>

      <div className="pt-4">
        <ol className="grid grid-cols-2 gap-x-3 gap-y-5 px-gutter">
          {first && <RankHero entry={first.item} locale={locale} rank={first.rank} basis={basis} />}
          {grid.map((r) => (
            <ProductCard key={r.item.slug} entry={r.item} locale={locale} rank={r.rank} />
          ))}
        </ol>
        {rows.length > 0 && (
          <ol start={GRID_UNTIL + 1} className="mt-3">
            {rows.map((r) => (
              <RankRow key={r.item.slug} entry={r.item} locale={locale} rank={r.rank} />
            ))}
          </ol>
        )}
      </div>

      <MethodNote locale={locale} />

      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
      <CrossRail from="beauty" locale={locale} />
    </>
  );
}
