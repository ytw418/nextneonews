import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AffiliateBox } from "@/components/affiliate/AffiliateBox";
import { AppHeader } from "@/components/AppHeader";
import { BuyStrip } from "@/components/beauty/BuyStrip";
import { Crumbs } from "@/components/beauty/Crumbs";
import { Price } from "@/components/beauty/Price";
import { ProductCard } from "@/components/beauty/ProductCard";
import { ProductVote } from "@/components/beauty/ProductVote";
import { ChevronDownIcon } from "@/components/icons";
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { beautySlugs, getBeauty } from "@/data/beauty";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { PARTNER_NAME, partnersForLocale } from "@/lib/affiliate";
import { brandGlyph, isEditorsPick, PERCENT_MIN_VOTES, readerRating } from "@/lib/beauty";
import { emptyTotals } from "@/lib/item-votes";
import { breadcrumbLd, graph, productLd } from "@/lib/jsonld-catalog";

import { loadBeauty } from "../../data";
import { absoluteUrl, beautyCrumbs, beautyMetadata } from "../../meta";

export const revalidate = 3600;
export const dynamicParams = false;

// 같은 분류 다른 제품 수 (2열 그리드 + 마지막 칸은 분류 전체 보기)
const RELATED = 3;
const BUY_ANCHOR = "affiliate-beauty-detail"; // AffiliateBox 제목 id (affiliate-{placement})

export function generateStaticParams() {
  return beautySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty/p/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const [t, entry, data] = await Promise.all([
    getTranslations({ locale, namespace: "Beauty" }),
    getBeauty(slug, locale),
    loadBeauty(locale),
  ]);
  if (!entry) return {};
  const title = t("product.metaTitle", { brand: entry.brand, name: entry.text.name });
  const meta = beautyMetadata({
    locale,
    path: `/beauty/p/${slug}`,
    title,
    description: t("product.metaDescription", {
      tagline: entry.text.tagline,
      category: data.text.categories[entry.category].name,
    }),
  });
  // 제품 상세는 사이트명 꼬리(' | Unnie Note')를 뺀다 — 긴 제품명에서 검색 결과 제목이 잘리지 않게 ('어디서 사나' 가 앞)
  return { ...meta, title: { absolute: title } };
}

// 제품 상세: 커버 → 이름·브랜드·₩(범례는 접힘) → 구매 줄(PR·고지·버튼 1) → 써 봤어요? → 한 줄 → 피부 타입·성분 → 왜·쓰는 법·주의
// → 어디서 사나 → 같은 분류 3 → 광고 → 다른 섹션. 아이폰 15(390×844) 첫 화면에 구매 버튼과 투표 칩이 함께 들어오고 광고는 0.
// 광고는 구매 상자와 그리드 한 블록 이상 떨어진다
export default async function BeautyProductPage({ params }: PageProps<"/[locale]/beauty/p/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, entry, data] = await Promise.all([
    getTranslations("Beauty"),
    getTranslations("Guide"),
    getTranslations("Article"),
    getBeauty(slug, locale),
    loadBeauty(locale),
  ]);
  if (!entry) notFound();

  const { name, tagline, why, howTo, caution } = entry.text;
  const category = data.text.categories[entry.category].name;
  const ranked = data.ranked.get(entry.category) ?? [];
  const rank = ranked.find((r) => r.item.slug === slug)?.rank;
  const kind = isEditorsPick(data.votes.get(entry.category) ?? 0) ? t("editorsPicks") : t("awardsName");
  const totals = data.totals.get(slug) ?? emptyTotals("beauty");
  const rating = readerRating(totals);
  const shops = partnersForLocale(locale, entry.buy);
  const related = ranked.filter((r) => r.item.slug !== slug).slice(0, RELATED);
  const awardsHref = `/beauty/awards/${entry.category}`;
  const pageUrl = absoluteUrl(locale, `/beauty/p/${slug}`);
  const awardsTitle = t("awards.title", { category, kind });

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref={awardsHref}
        action={
          <>
            <SaveButton kind="beauty" id={slug} title={name} />
            <ShareButton title={`${entry.brand} ${name}`} label={t("product.share")} copiedLabel={t("copied")} />
          </>
        }
      />
      <JsonLd
        data={graph(
          productLd({
            url: pageUrl,
            name,
            brand: entry.brand,
            description: tagline,
            category,
            rating,
          }),
          breadcrumbLd(
            beautyCrumbs(locale, tGuide("title"), t("title"), [
              { name: awardsTitle, url: absoluteUrl(locale, awardsHref) },
              { name, url: pageUrl },
            ]),
          ),
        )}
      />

      <TypeCover
        tint={SECTION_TINT.beauty}
        glyph={brandGlyph(entry.brand)}
        variant="hero"
        label={category}
        isNew={isNew(entry.addedAt)}
        newLabel={t("newBadge")}
        locale={locale}
      >
        {/* 사진 대신 커버의 주인공은 순위 숫자 (어워드 안 순위) */}
        {rank && (
          <p className="absolute bottom-4 left-5 flex items-baseline gap-2 text-on-tint">
            <span aria-hidden className="numeral text-display">
              {rank}
            </span>
            <span aria-hidden className="text-t7 font-semibold text-on-tint-sub">
              {kind}
            </span>
            <span className="sr-only">{t("product.rankIn", { rank, category, kind })}</span>
          </p>
        )}
      </TypeCover>

      <div className="px-gutter pt-4">
        <h1 className="text-t3 font-bold text-ink-900">
          <Words text={name} locale={locale} />
        </h1>
        {/* 가격 범례는 가격 옆 ▾ 로 접는다 (두 줄을 펼쳐 두면 투표 칩이 첫 화면 밖으로 밀린다). 자바스크립트 없이 열린다 */}
        <details className="group mt-1">
          <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-2 [&::-webkit-details-marker]:hidden">
            <span className="text-t6 font-semibold text-ink-600">{entry.brand}</span>
            <span aria-hidden className="text-ink-400">
              ·
            </span>
            <Price
              tier={entry.priceTier}
              label={t(`priceTier.${entry.priceTier}`)}
              className="text-t5 font-semibold text-ink-900"
            />
            <ChevronDownIcon className="size-4 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
          </summary>
          <p className="mt-0.5 text-st12 text-ink-600">{t("priceLegend")}</p>
        </details>
      </div>

      {shops[0] && <BuyStrip locale={locale} target={shops[0]} itemId={slug} moreHref={`#${BUY_ANCHOR}`} />}

      <div className="px-gutter pt-4">
        <ProductVote itemId={slug} initial={totals} showPercent={totals.total >= PERCENT_MIN_VOTES} />
        {rating && (
          <p className="mt-1 px-1 text-t7 tabular-nums text-ink-600">
            {t("product.rating", { value: rating.value, count: rating.count })}
          </p>
        )}
      </div>

      <p className="px-gutter pt-5 text-t5 font-medium text-ink-900">
        <Words text={tagline} locale={locale} />
      </p>

      <dl className="px-gutter pt-4">
        <dt className="text-st12 font-semibold text-ink-600">{t("product.suits")}</dt>
        <dd className="mt-1.5">
          <ul className="flex flex-wrap gap-2">
            {entry.skinTypes.map((skin) => (
              <li key={skin}>
                <Link
                  href={`/beauty/skin-type/${skin}`}
                  className="press hit relative inline-flex min-h-9 items-center rounded-full bg-card px-3.5 text-t7 font-semibold text-ink-700 ring-1 ring-line ring-inset"
                >
                  {t(`skin.short.${skin}`)}
                </Link>
              </li>
            ))}
          </ul>
        </dd>
        <dt className="mt-4 text-st12 font-semibold text-ink-600">{t("product.ingredients")}</dt>
        <dd className="mt-1.5">
          <ul className="flex flex-wrap gap-2">
            {entry.keyIngredients.map((ingredient) => (
              <li key={ingredient} className="inline-flex min-h-8 items-center rounded-full bg-fill-weak px-3 text-t7 text-ink-700">
                {ingredient}
              </li>
            ))}
          </ul>
        </dd>
      </dl>

      <section aria-labelledby="beauty-why" className="px-gutter pt-8">
        <h2 id="beauty-why" className="text-t4 font-bold text-ink-900">
          {t("product.why")}
        </h2>
        <p className="mt-2 text-t5 text-ink-700">{why}</p>
      </section>
      <section aria-labelledby="beauty-how" className="px-gutter pt-6">
        <h2 id="beauty-how" className="text-t4 font-bold text-ink-900">
          {t("product.howTo")}
        </h2>
        <p className="mt-2 text-t5 text-ink-700">{howTo}</p>
      </section>
      {caution && (
        <section aria-labelledby="beauty-caution" className="px-gutter pt-6">
          <h2 id="beauty-caution" className="text-t4 font-bold text-ink-900">
            {t("product.caution")}
          </h2>
          <p className="mt-2 text-t5 text-ink-700">{caution}</p>
        </section>
      )}

      {/* 빵부스러기는 본문 끝에 (첫 화면에는 구매 버튼이 먼저 들어오게) */}
      <div className="pt-4">
        <Crumbs
          label={t("crumbsLabel")}
          items={[
            { name: t("title"), href: "/beauty" },
            { name: awardsTitle, href: awardsHref },
            { name },
          ]}
        />
      </div>

      <div aria-hidden className="mt-8 h-4 bg-band" />
      <AffiliateBox
        title={t("buy.title")}
        locale={locale}
        placement="beauty-detail"
        items={shops.map((target) => ({
          target,
          label: PARTNER_NAME[target.partner],
          sub: t(`ship.${target.partner}`),
          itemId: slug,
        }))}
      />

      {related.length > 0 && (
        <section aria-labelledby="beauty-related">
          <div aria-hidden className="mt-8 h-4 bg-band" />
          <SectionHeader
            id="beauty-related"
            title={t("product.related", { category })}
            href={awardsHref}
            linkLabel={t("seeAll")}
          />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-gutter">
            {related.map((r) => (
              <ProductCard key={r.item.slug} entry={r.item} locale={locale} rank={r.rank} />
            ))}
            <li>
              <Link href={awardsHref} className="press-soft block">
                <TypeCover
                  tint={SECTION_TINT.beauty}
                  glyph={String(ranked.length)}
                  label={kind}
                  title={t("product.relatedAll", { category })}
                  sub={t("product.relatedCount", { count: ranked.length })}
                  locale={locale}
                />
              </Link>
            </li>
          </ul>
        </section>
      )}

      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
      <CrossRail from="beauty" locale={locale} exclude={slug} />
    </>
  );
}
