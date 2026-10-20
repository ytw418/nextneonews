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
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { SaveButton } from "@/components/SaveButton";
import { ShareButton } from "@/components/ShareButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { beautySlugs, beautyText, getBeauty, isBeautySlug } from "@/data/beauty";
import { BEAUTY_CATEGORY_ICON, beautyCover, iconCover } from "@/data/cover";
import { isNew, SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { PARTNER_NAME, partnersForLocale } from "@/lib/affiliate";
import { BEAUTY_DETAIL_BUY_ANCHOR, isEditorsPick, readerRating } from "@/lib/beauty";
import { emptyTotals } from "@/lib/item-votes";
import { breadcrumbLd, graph, productLd } from "@/lib/jsonld-catalog";

import { loadBeauty, staticParamsFor } from "../../data";
import { absoluteUrl, beautyCrumbs, beautyMetadata } from "../../meta";

// 정적: 다시 그리기는 파이프라인의 하루 1번 무효화만 (../../data.ts). 색인 언어 밖은 첫 요청 때 만들고, 없는 slug 는 notFound
export const revalidate = false;

// 같은 분류 다른 제품 수 (2열 그리드 + 마지막 칸은 분류 전체 보기)
const RELATED = 3;
// 커버 높이 상한: 4:3(390폭에서 292px)은 첫 화면의 44% 가 빈 색 상자였다. 128px 이면 이름·가격·구매·투표가 첫 화면에 든다.
// 폭을 w-full 로 정해 둔다 — 폭이 auto 면 비율 때문에 높이 상한이 폭으로 옮겨 가 커버가 반쪽이 된다
const HERO_SIZE = "w-full max-h-32";

export function generateStaticParams({ params }: { params: { locale: string } }) {
  return staticParamsFor(params.locale, "slug", beautySlugs());
}

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty/p/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  // 없는 주소(봇이 지어낸 slug)는 문구·집계를 읽기 전에 돌려보낸다
  if (!isLocale(locale) || !isBeautySlug(slug)) return {};
  const [t, entry, text] = await Promise.all([
    getTranslations({ locale, namespace: "Beauty" }),
    getBeauty(slug, locale),
    beautyText(locale),
  ]);
  if (!entry) return {};
  const title = t("product.metaTitle", { brand: entry.brand, name: entry.text.name });
  const meta = beautyMetadata({
    locale,
    path: `/beauty/p/${slug}`,
    title,
    description: t("product.metaDescription", {
      tagline: entry.text.tagline,
      category: text.categories[entry.category].name,
    }),
  });
  // 제품 상세는 사이트명 꼬리(' | Unnie Note')를 뺀다 — 긴 제품명에서 검색 결과 제목이 잘리지 않게 ('어디서 사나' 가 앞)
  return { ...meta, title: { absolute: title } };
}

// 제품 상세: 낮은 커버 → 이름·브랜드·가격 → 구매 줄(PR·고지·버튼 1) → 써 봤어요? → 한 줄 → 피부 타입·성분 → 왜·쓰는 법·주의
// → 어디서 사나 → 같은 분류 3 → 광고 → 다른 섹션. 아이폰 사파리에서 보이는 높이(390×664)에 제품명·구매 버튼·투표 칩이 함께 들어오고 광고는 0.
// 광고는 구매 상자와 그리드 한 블록 이상 떨어진다
export default async function BeautyProductPage({ params }: PageProps<"/[locale]/beauty/p/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale) || !isBeautySlug(slug)) notFound();
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
        cover={beautyCover(entry)}
        variant="hero"
        label={category}
        isNew={isNew(entry.addedAt)}
        newLabel={t("newBadge")}
        locale={locale}
        className={HERO_SIZE}
      >
        {/* 어워드 안 순위: 왼쪽 아래 (대표 성분 아이콘은 오른쪽) */}
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
        {/* 가격은 범위 글자 그대로 (₩₩ 기호·펼침 없음). 한국 정가라는 설명은 산식 공개(MethodNote)와 어워드 화면에 있다 */}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-t6 font-semibold text-ink-600">{entry.brand}</span>
          <span aria-hidden className="text-ink-400">
            ·
          </span>
          <Price tier={entry.priceTier} locale={locale} className="text-t5 font-semibold text-ink-900" />
        </p>
      </div>

      {shops[0] && <BuyStrip locale={locale} target={shops[0]} itemId={slug} moreHref={`#${BEAUTY_DETAIL_BUY_ANCHOR}`} />}

      <div className="px-gutter pt-4">
        <ProductVote itemId={slug} initial={totals} />
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
                  cover={iconCover(BEAUTY_CATEGORY_ICON[entry.category])}
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
