import { isLocale, LOCALE_PATH_PREFIX, SITE_NAME } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { EmptyMemo } from "@/components/EmptyMemo";
import { ChevronRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { RankingMiniCard } from "@/components/rankings/RankingMiniCard";
import { ListRow } from "@/components/ui/ListRow";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { hubJsonLd } from "@/lib/jsonld-rankings";
import { CHART_IDS, CHART_KEY, displayName, getEntities, getLatestSnapshot, periodLabel } from "@/lib/rankings";
import { localeAlternates, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

export const revalidate = 3600;

// 차트마다 최신판 (generateMetadata 와 본문이 같은 요청에서 한 번만 조회한다 — getLatestSnapshot 은 cache)
async function latestCharts() {
  const snapshots = await Promise.all(CHART_IDS.map((chart) => getLatestSnapshot(chart)));
  return CHART_IDS.map((chart, i) => ({ chart, snapshot: snapshots[i] ?? null })).flatMap(({ chart, snapshot }) =>
    snapshot && snapshot.items.length > 0 ? [{ chart, snapshot }] : [],
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/rankings">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Rankings" });
  const charts = await latestCharts();
  const alternates = localeAlternates(locale, "/rankings");
  return {
    title: t("hub.metaTitle"),
    description: t("hub.metaDescription"),
    alternates,
    // 첫 차트가 나오기 전(빈 화면)에는 색인하지 않는다
    robots: charts.length > 0 ? undefined : { index: false },
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title: t("hub.metaTitle"),
      description: t("hub.metaDescription"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 랭킹 탭: 차트마다 1~3위 카드, 첫 문장은 차트별 1위 한 줄씩. 아래에 계산 방법과 공개 데이터
export default async function RankingsHubPage({ params }: PageProps<"/[locale]/rankings">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, charts] = await Promise.all([getTranslations("Rankings"), latestCharts()]);
  const entities = await getEntities(charts.flatMap(({ snapshot }) => snapshot.items.slice(0, 3).map((i) => i.entityId)));
  const prefix = LOCALE_PATH_PREFIX[locale];
  const titleOf = (chart: (typeof CHART_IDS)[number]) => t(`chart.${CHART_KEY[chart]}.title`);

  return (
    <>
      <AppHeader title={t("hub.title")} />
      <JsonLd
        data={hubJsonLd({
          locale,
          name: t("hub.title"),
          description: t("hub.metaDescription"),
          pageUrl: `${SITE_URL}${prefix}/rankings`,
          charts: charts.map(({ chart }) => ({ name: titleOf(chart), url: `${SITE_URL}${prefix}/rankings/${chart}` })),
          crumbs: [
            { name: SITE_NAME, url: `${SITE_URL}${prefix}` },
            { name: t("tab"), url: `${SITE_URL}${prefix}/rankings` },
          ],
        })}
      />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{t("hub.title")}</h1>
        <p className="mt-1 text-t6 text-ink-600">{t("hub.lead")}</p>
      </div>

      {charts.length === 0 ? (
        <EmptyMemo text={t("empty")} tint="var(--tint-kpop)">
          <Link href="/" className="press inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-on-tint">
            {t("emptyCta")}
            <ChevronRightIcon className="size-4 text-on-tint-sub" />
          </Link>
        </EmptyMemo>
      ) : (
        <>
          {/* 답부터: 차트별 1위 한 줄씩 (AI 답변·검색 스니펫이 그대로 인용한다) */}
          <p className="rank-answer px-gutter pt-4 text-t5 font-medium text-ink-900">
            {charts.map(({ chart, snapshot }) => (
              <span key={chart} className="block">
                {t("hub.leader", {
                  name: displayName(snapshot.items[0]!.names, locale, snapshot.items[0]!.entityId),
                  chart: titleOf(chart),
                  date: periodLabel(snapshot.period, locale),
                })}
              </span>
            ))}
          </p>
          <ul className="grid grid-cols-1 gap-3 px-gutter pt-5 min-[480px]:grid-cols-2">
            {charts.map(({ chart, snapshot }) => (
              <li key={chart}>
                <RankingMiniCard chart={chart} title={titleOf(chart)} snapshot={snapshot} entities={entities} locale={locale} />
              </li>
            ))}
          </ul>
        </>
      )}

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <ul>
        <ListRow href="/rankings/methodology" arrow title={t("hub.methodology")} sub={t("hub.methodologySub")} />
      </ul>

      <section aria-labelledby="rankings-data">
        <SectionHeader id="rankings-data" title={t("hub.dataTitle")} />
        <p className="px-gutter text-t6 text-ink-700">{t("hub.dataBody")}</p>
        <ul className="px-gutter pt-3">
          {CHART_IDS.map((chart) => {
            const api = `/api/rankings/${chart}/history?days=90&top=30`;
            return (
              <li key={chart} className="flex min-h-11 flex-wrap items-center gap-x-3 border-b border-line py-2 last:border-b-0">
                <span className="min-w-0 flex-1 text-t6 font-semibold text-ink-900">{titleOf(chart)}</span>
                <a href={api} className="press inline-flex min-h-9 items-center rounded-full bg-fill-weak px-3 text-t7 font-semibold text-ink-700">
                  JSON
                </a>
                <a
                  href={`${api}&format=csv`}
                  className="press inline-flex min-h-9 items-center rounded-full bg-fill-weak px-3 text-t7 font-semibold text-ink-700"
                >
                  CSV
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
