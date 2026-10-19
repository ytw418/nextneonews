import { isLocale, type Locale, LOCALE_PATH_PREFIX, SITE_NAME, WIKI_BY_LOCALE } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { cache } from "react";

import { AppHeader } from "@/components/AppHeader";
import { EmptyMemo } from "@/components/EmptyMemo";
import { ChevronRightIcon } from "@/components/icons";
import { IdolArticles } from "@/components/idol/IdolArticles";
import { IdolHero } from "@/components/idol/IdolHero";
import { IdolRank } from "@/components/idol/IdolRank";
import { KoreaBuzzStats } from "@/components/idol/KoreaBuzzStats";
import { LanguageInterest } from "@/components/idol/LanguageInterest";
import { JsonLd } from "@/components/JsonLd";
import { EventRow } from "@/components/schedule/EventRow";
import { ShareButton } from "@/components/ShareButton";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import {
  canonicalSlug,
  entityChart,
  getEntityBySlug,
  getKoreaBuzz,
  getLanguageInterest,
  getRankHistory,
  inRecentTop30,
  listEntityArticles,
  namesOf,
  wikipediaUrls,
} from "@/lib/entities";
import { entityPhoto } from "@/lib/entity-image";
import { toFeedItems } from "@/lib/articles";
import { idolJsonLd } from "@/lib/jsonld-rankings";
import {
  CHART_KEY,
  CHART_TINT,
  displayName,
  eventsFor,
  periodLabel,
  readLatestSnapshot,
  secondaryName,
  todayCheers,
} from "@/lib/rankings";
import { localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

// 순위는 매일 05:00 KST, 조회 수·국내 화제는 하루 몇 번 바뀐다. 한 시간마다 다시 만든다
export const revalidate = 3600;

// 인물 페이지는 빌드 때 만들지 않고 첫 요청 때 만든 뒤 캐시한다
export function generateStaticParams() {
  return [];
}

// 배지 문구가 있는 종류 (Entity.type)
const TYPES = new Set(["group", "singer", "actor", "series"]);

// generateMetadata 와 본문이 같은 요청에서 한 번만 조회한다: 인물 · 차트 최신판 · 관련 글 · 언어별 관심도 · 색인 여부
const loadIdol = cache(async (locale: Locale, slug: string) => {
  const entity = await getEntityBySlug(slug);
  if (!entity) return null;
  const chart = entityChart(entity.type);
  const [snapshot, articles, interest, top30] = await Promise.all([
    // 공유 캐시(랭킹 태그)를 쓰지 않는다: 매일 랭킹 태그를 비울 때 인물 3,400쪽이 함께 비워지면 봇이 DB 를 깨운다
    chart ? readLatestSnapshot(chart) : null,
    listEntityArticles(locale, entity),
    getLanguageInterest(entity.id),
    inRecentTop30(entity.id),
  ]);
  const item = snapshot?.items.find((i) => i.entityId === entity.id) ?? null;
  // 색인 규칙: 최근 30일 차트 상위 30에 들었거나(sitemap 과 같은 기준) 이 언어로 읽을 관련 글이 있을 때만
  return { entity, chart, snapshot, item, articles, interest, indexable: top30 || articles.length > 0 };
});

type Idol = NonNullable<Awaited<ReturnType<typeof loadIdol>>>;

// 답부터 쓰는 문장 (AI 답변·검색 스니펫이 그대로 인용한다): 오늘 순위 + 위키백과 조회가 가장 많은 언어
async function answerOf(idol: Idol, locale: Locale, name: string): Promise<string> {
  const [t, tr] = await Promise.all([
    getTranslations({ locale, namespace: "Idol" }),
    getTranslations({ locale, namespace: "Rankings" }),
  ]);
  const { chart, snapshot, item, interest } = idol;
  const top = interest[0];
  return [
    chart &&
      snapshot &&
      item &&
      t("rankAnswer", {
        name,
        rank: item.rank,
        chart: tr(`chart.${CHART_KEY[chart]}.title`),
        date: periodLabel(snapshot.period, locale),
      }),
    top &&
      t("topLanguage", { name, language: new Intl.DisplayNames([locale], { type: "language" }).of(top.lang) ?? top.lang }),
  ]
    .filter((s): s is string => !!s)
    .join(" ");
}

export async function generateMetadata({ params }: PageProps<"/[locale]/idol/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const idol = await loadIdol(locale, slug);
  if (!idol) return {};
  const t = await getTranslations({ locale, namespace: "Idol" });
  const name = displayName(namesOf(idol.entity), locale, idol.entity.id);
  const title = t("metaTitle", { name });
  const description = (await answerOf(idol, locale, name)) || t("metaDescription", { name });
  const alternates = localeAlternates(locale, `/idol/${idol.entity.slug}`);
  const photo = entityPhoto(idol.entity);
  return {
    title,
    description,
    alternates,
    // 글도 순위도 없는 인물은 빈 페이지에 가까워 색인하지 않는다 (링크는 따라간다)
    robots: pageRobots(idol.indexable),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title,
      description,
      images: [photo?.src ?? `${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 인물·작품 허브 (모바일 우선). 위에서부터: 사진·이름·응원 → 답부터 쓰는 문장 → 차트 순위·90일 선 →
// 언어별 관심도 → 이번 주 한국 반응 → 다가오는 일정 → 관련 글
export default async function IdolPage({ params }: PageProps<"/[locale]/idol/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const idol = await loadIdol(locale, slug);
  if (!idol) {
    // /idol/q12345 (위키데이터 Q-id)·대문자 주소는 지금 주소로 영구 이동
    const target = await canonicalSlug(slug);
    if (target) permanentRedirect(`${LOCALE_PATH_PREFIX[locale]}/idol/${target}`);
    notFound();
  }
  const { entity, chart, snapshot, item, articles, interest } = idol;

  const [t, tr, tArticle, buzz, history, cheers, news, answer] = await Promise.all([
    getTranslations("Idol"),
    getTranslations("Rankings"),
    getTranslations("Article"),
    getKoreaBuzz(entity.id),
    chart && snapshot ? getRankHistory(chart, entity.id) : Promise.resolve([] as (number | null)[]),
    todayCheers([entity.id]),
    toFeedItems(articles, locale),
    answerOf(idol, locale, displayName(namesOf(entity), locale, entity.id)),
  ]);

  const names = namesOf(entity);
  const name = displayName(names, locale, entity.id);
  const photo = entityPhoto(entity);
  const events = eventsFor(names).slice(0, 3);
  const chartName = chart ? tr(`chart.${CHART_KEY[chart]}.title`) : null;
  const prefix = LOCALE_PATH_PREFIX[locale];
  const pageUrl = `${SITE_URL}${prefix}/idol/${entity.slug}`;
  const hasData = interest.length > 0 || buzz.posts + buzz.trendDays > 0;

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref={chart ? `/rankings/${chart}` : "/rankings"}
        title={name}
        action={<ShareButton title={name} label={t("share")} copiedLabel={tArticle("copied")} />}
      />
      <JsonLd
        data={idolJsonLd({
          type: entity.type,
          name,
          alternateNames: [entity.ko, entity.en, entity.ja, entity.zhHant],
          image: photo?.src ?? null,
          pageUrl,
          sameAs: [`https://www.wikidata.org/wiki/${entity.id}`, ...wikipediaUrls(entity.wikiTitles)],
          crumbs: [
            { name: SITE_NAME, url: `${SITE_URL}${prefix}` },
            { name: tr("tab"), url: `${SITE_URL}${prefix}/rankings` },
            ...(chart && chartName ? [{ name: chartName, url: `${SITE_URL}${prefix}/rankings/${chart}` }] : []),
            { name, url: pageUrl },
          ],
        })}
      />

      <IdolHero
        entityId={entity.id}
        chart={chart ?? "idol"}
        name={name}
        subName={secondaryName(names, locale)}
        subLang={locale === "ko" ? "en" : "ko"}
        typeLabel={TYPES.has(entity.type) ? t(`type.${entity.type}`) : null}
        photo={photo}
        tint={chart ? CHART_TINT[chart] : "var(--tint-kent)"}
        cheers={cheers.get(entity.id) ?? 0}
      />

      {answer && <p className="rank-answer px-gutter pt-5 text-t5 font-medium text-ink-900">{answer}</p>}

      {chart && chartName && snapshot && (
        <IdolRank chart={chart} chartName={chartName} locale={locale} period={snapshot.period} item={item} history={history} />
      )}

      {hasData && <div aria-hidden className="mt-6 h-4 bg-band" />}
      <LanguageInterest rows={interest} locale={locale} readerLang={WIKI_BY_LOCALE[locale]} />
      <KoreaBuzzStats buzz={buzz} locale={locale} />

      {(events.length > 0 || news.length > 0) && <div aria-hidden className="mt-6 h-4 bg-band" />}
      {events.length > 0 && (
        <section aria-labelledby="idol-upcoming">
          <SectionHeader id="idol-upcoming" title={t("upcomingTitle")} />
          <ul className="@container">
            {events.map((e) => (
              <EventRow key={e.id} e={e} locale={locale} />
            ))}
          </ul>
        </section>
      )}
      <IdolArticles items={news} locale={locale} title={t("newsTitle", { name })} />

      {!hasData && news.length === 0 && (
        <EmptyMemo text={t("empty", { name })} tint={chart ? CHART_TINT[chart] : "var(--tint-kent)"}>
          <Link href="/rankings" className="press inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-on-tint">
            {t("emptyCta")}
            <ChevronRightIcon className="size-4 text-on-tint-sub" />
          </Link>
        </EmptyMemo>
      )}
    </>
  );
}
