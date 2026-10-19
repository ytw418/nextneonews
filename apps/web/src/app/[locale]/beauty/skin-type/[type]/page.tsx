import { isLocale } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AdSlot } from "@/components/AdSlot";
import { AppHeader } from "@/components/AppHeader";
import { Crumbs } from "@/components/beauty/Crumbs";
import { ProductCard } from "@/components/beauty/ProductCard";
import { CrossRail } from "@/components/guide/CrossRail";
import { TypeCover } from "@/components/guide/TypeCover";
import { Words } from "@/components/guide/Words";
import { JsonLd } from "@/components/JsonLd";
import { QuizShare, TrackQuizShare } from "@/components/quiz/QuizShare";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SKIN_TYPES, type SkinType } from "@/data/beauty/types";
import { SECTION_TINT } from "@/data/sections";
import { Link } from "@/i18n/navigation";
import { isSkinType, picksForSkin, rankAwards, SHARE_DOMAIN, SKIN_CODE } from "@/lib/beauty";
import { breadcrumbLd, graph, itemListLd } from "@/lib/jsonld-catalog";

import { loadBeauty } from "../../data";
import { absoluteUrl, beautyCrumbs, beautyMetadata, webPageLd } from "../../meta";

export const revalidate = 3600;
export const dynamicParams = false;

// 이 타입을 위한 제품 수 (2열 그리드 + 마지막 칸은 뷰티 전체)
const PICKS = 5;

export function generateStaticParams() {
  return SKIN_TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/beauty/skin-type/[type]">): Promise<Metadata> {
  const { locale, type } = await params;
  if (!isSkinType(type)) return {};
  const t = await getTranslations({ locale, namespace: "Beauty" });
  const name = t(`skin.result.${type}`);
  // 공유 이미지는 같은 폴더의 opengraph-image.tsx (라틴 글자만)
  return beautyMetadata({
    locale,
    path: `/beauty/skin-type/${type}`,
    title: t("result.metaTitle", { name }),
    description: t("result.metaDescription", { name }),
    ogImage: false,
  });
}

// 테스트 결과: 틴트 히어로(타입 코드·주소) → 타입 이름 → 한 줄 → 공유·다시 하기 → 이 타입을 위한 제품 5
// → 관리 팁 3 → 다른 타입 → 광고 → 다른 섹션. 공유 링크로 들어온 친구는 이 화면만 본다 (이 기기 타입은 바꾸지 않는다)
export default async function SkinTypeResultPage({ params }: PageProps<"/[locale]/beauty/skin-type/[type]">) {
  const { locale, type } = await params;
  if (!isLocale(locale) || !isSkinType(type)) notFound();
  setRequestLocale(locale);

  const [t, tGuide, tArticle, data] = await Promise.all([
    getTranslations("Beauty"),
    getTranslations("Guide"),
    getTranslations("Article"),
    loadBeauty(locale),
  ]);
  const skin: SkinType = type;
  const result = data.text.skinType.results[skin];
  const name = t(`skin.result.${skin}`);
  const picks = picksForSkin(rankAwards(data.entries, data.totals), skin, PICKS);
  const quizUrl = absoluteUrl(locale, "/beauty/skin-type");
  const pageUrl = absoluteUrl(locale, `/beauty/skin-type/${skin}`);
  const picksTitle = t("result.picks", { name });

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/beauty/skin-type"
        action={
          <TrackQuizShare quiz="skin-type" result={skin}>
            <ShareButton title={t("result.shareText", { name })} label={t("result.share")} copiedLabel={t("copied")} />
          </TrackQuizShare>
        }
      />
      <JsonLd
        data={graph(
          webPageLd({ url: pageUrl, name, description: result.oneLiner, locale }),
          itemListLd({
            pageUrl,
            name: picksTitle,
            items: picks.map((p) => ({
              name: `${p.brand} ${p.text.name}`,
              url: absoluteUrl(locale, `/beauty/p/${p.slug}`),
              type: "Product",
            })),
          }),
          breadcrumbLd(
            beautyCrumbs(locale, tGuide("title"), t("title"), [
              { name: data.text.skinType.title, url: quizUrl },
              { name, url: pageUrl },
            ]),
          ),
        )}
      />

      {/* 유령 글자는 타입 코드 첫 글자 (SENSITIVE 처럼 긴 코드는 이름 뒤를 가로질러 읽기 어렵다 — 공유 이미지와 같은 규칙) */}
      <TypeCover tint={SECTION_TINT.beauty} glyph={SKIN_CODE[skin].slice(0, 1)} variant="hero" label={t("result.label")}>
        {/* 결과 화면을 캡처해 올려도 무슨 결과인지·어디서 했는지 커버 한 장에 보이게 */}
        <div className="absolute inset-x-5 bottom-4">
          <h1 className="text-display font-bold text-on-tint [overflow-wrap:anywhere] hyphens-auto">{name}</h1>
          <p className="mt-2 text-st12 font-semibold text-on-tint-sub">{SHARE_DOMAIN}</p>
        </div>
      </TypeCover>

      <Crumbs
        label={t("crumbsLabel")}
        items={[
          { name: t("title"), href: "/beauty" },
          { name: data.text.skinType.title, href: "/beauty/skin-type" },
        ]}
      />
      <div className="px-gutter">
        <p className="pt-1 text-t5 text-ink-700">
          <Words text={result.oneLiner} locale={locale} />
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <QuizShare
            quiz="skin-type"
            result={skin}
            locale={locale}
            text={t("result.shareText", { name })}
            label={t("result.share")}
            copiedLabel={t("copied")}
          />
          <Button size="l" variant="neutral" href="/beauty/skin-type">
            {t("result.retake")}
          </Button>
        </div>
        <p className="mt-3 text-st12 text-ink-600">{data.text.skinType.disclaimer}</p>
      </div>

      {picks.length > 0 && (
        <section aria-labelledby="skin-picks">
          <SectionHeader id="skin-picks" title={picksTitle} />
          <ul className="grid grid-cols-2 gap-x-3 gap-y-5 px-gutter">
            {picks.map((p) => (
              <ProductCard key={p.slug} entry={p} locale={locale} label={data.text.categories[p.category].name} />
            ))}
            <li>
              <Link href="/beauty" className="press-soft block">
                <TypeCover
                  tint={SECTION_TINT.beauty}
                  glyph={String(data.entries.length)}
                  label={t("title")}
                  title={t("result.allTitle")}
                  sub={t("result.allSub", { count: data.entries.length })}
                  locale={locale}
                />
              </Link>
            </li>
          </ul>
        </section>
      )}

      <section aria-labelledby="skin-tips" className="px-gutter pt-8">
        <h2 id="skin-tips" className="text-t4 font-bold text-ink-900">
          {t("result.tips")}
        </h2>
        <ol className="mt-3 flex flex-col gap-3">
          {result.tips.map((tip, i) => (
            <li key={tip} className="flex gap-3 rounded-card bg-card p-4 shadow-card">
              <span aria-hidden className="w-5 shrink-0 text-t5 font-bold tabular-nums text-ink-600">
                {i + 1}
              </span>
              <span className="text-t6 text-ink-700">{tip}</span>
            </li>
          ))}
        </ol>
      </section>

      <nav aria-labelledby="skin-others" className="pt-2">
        <SectionHeader id="skin-others" title={t("result.others")} />
        <ul className="flex flex-wrap gap-2 px-gutter">
          {SKIN_TYPES.filter((s) => s !== skin).map((s) => (
            <li key={s}>
              <Link
                href={`/beauty/skin-type/${s}`}
                className="press hit relative inline-flex min-h-[38px] items-center rounded-full bg-card px-3.5 text-t6 font-semibold text-ink-700 ring-1 ring-line ring-inset"
              >
                {t(`skin.result.${s}`)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_GUIDE ?? process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE}
      />
      <CrossRail from="beauty" locale={locale} />
    </>
  );
}
