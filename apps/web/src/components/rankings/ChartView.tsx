import { type ChartId, kstDay, LOCALE_PATH_PREFIX, type Locale, SITE_NAME, WIKI_BY_LOCALE } from "@kmedia/core";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { PollCard } from "@/components/article/PollCard";
import { AppHeader } from "@/components/AppHeader";
import { EmptyMemo } from "@/components/EmptyMemo";
import { ChevronRightIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { EntityAvatar } from "@/components/rankings/EntityAvatar";
import { PhotoCredits } from "@/components/rankings/PhotoCredits";
import { RankChange } from "@/components/rankings/RankChange";
import { RankHero } from "@/components/rankings/RankHero";
import { RankingList } from "@/components/rankings/RankingList";
import { RankingMiniCard } from "@/components/rankings/RankingMiniCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { weeklyPollView } from "@/lib/engagement";
import type { EntityPhoto } from "@/lib/entity-image";
import { chartJsonLd } from "@/lib/jsonld-rankings";
import {
  CHART_KEY,
  CHART_TINT,
  displayName,
  formatScore,
  getEntities,
  getFirstPeriod,
  getLatestSnapshot,
  isWeekPeriod,
  latestArticles,
  listHistory,
  listWeeklyPeriods,
  periodDateTime,
  periodLabel,
  secondaryName,
  type Snapshot,
  todayCheers,
} from "@/lib/rankings";
import { localeAlternates, localeHomePath, ogBase, pageRobots, SITE_URL } from "@/lib/url";

// 'Rankings' 네임스페이스 번역 함수 (lib/schedule.ts 의 Translate 와 같은 모양)
type T = (key: string, values?: Record<string, string | number>) => string;

const HERO_UNTIL = 1;

function chartPath(chart: ChartId, period?: string) {
  return `/rankings/${chart}${period ? `/${period}` : ""}`;
}

// '{1위} tops the K-pop Buzz Chart on {date}, followed by {2위} and {3위}.' — AI 답변이 그대로 인용하기 좋은 첫 문장
function answerSentence(t: T, snapshot: Snapshot, chartName: string, locale: string): string {
  const [first, second, third] = snapshot.items.map((i) => displayName(i.names, locale, i.entityId));
  const args = {
    first: first ?? "",
    chart: chartName,
    date: periodLabel(snapshot.period, locale),
    period: isWeekPeriod(snapshot.period) ? "week" : "day",
  };
  return second && third ? t("answer", { ...args, second, third }) : t("answerShort", args);
}

// 차트 페이지·주간 아카이브 공통 메타데이터. 스냅숏이 없으면(첫 05:00 전) noindex
export async function chartMetadata(locale: string, chart: ChartId, snapshot: Snapshot | null, period?: string): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Rankings" });
  const chartName = t(`chart.${CHART_KEY[chart]}.title`);
  const title = snapshot ? `${chartName} — ${periodLabel(snapshot.period, locale)}` : chartName;
  const description = snapshot?.items.length
    ? answerSentence(t, snapshot, chartName, locale)
    : t(`chart.${CHART_KEY[chart]}.description`);
  const alternates = localeAlternates(locale, chartPath(chart, period));
  return {
    title,
    description,
    alternates,
    robots: pageRobots(!!snapshot?.items.length),
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title,
      description,
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

interface Props {
  locale: Locale;
  chart: ChartId;
  snapshot: Snapshot | null;
  archive?: boolean; // 주간 고정본 (/rankings/{chart}/{YYYY-Www})
}

// 차트 화면 (모바일 우선). 위에서부터: h1 → 기간 칩 → 출처 한 줄 → 답부터 쓰는 문장 → (팬 픽: 이번 주 투표) → 1위 히어로 →
// 2~10위 펼치는 줄 → 11~30위 표 → '{언어}에서 뜨는' → 이번 주 팬 투표 → 주간 아카이브 → 사진 출처
export async function ChartView({ locale, chart, snapshot, archive = false }: Props) {
  const t = await getTranslations("Rankings");
  const chartName = t(`chart.${CHART_KEY[chart]}.title`);
  const tint = CHART_TINT[chart];
  const header = <AppHeader variant="pushed" parentHref={archive ? chartPath(chart) : "/rankings"} title={chartName} />;
  // 팬 픽 차트는 이번 주 열린 투표가 곧 다음 판이다: 결과(지난주) 위에, 결과가 아직 없으면 빈 메모 대신 투표를 둔다
  const weeklyPoll = chart === "fan-pick" && !archive ? await weeklyPollView(locale) : null;
  const pollCard = weeklyPoll && (
    <PollCard poll={weeklyPoll} locale={locale} anchorId="weekly-poll" className="mx-gutter mt-6" />
  );

  if (!snapshot || snapshot.items.length === 0) {
    return (
      <>
        {header}
        <div className="px-gutter pt-6">
          <h1 className="text-st2 font-bold text-ink-900">{chartName}</h1>
          {pollCard && <p className="mt-3 text-t7 text-ink-600">{t("fanPickNote")}</p>}
        </div>
        {pollCard ?? (
          <EmptyMemo text={t("empty")} tint={tint}>
            <Link href="/" className="press inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-on-tint">
              {t("emptyCta")}
              <ChevronRightIcon className="size-4 text-on-tint-sub" />
            </Link>
          </EmptyMemo>
        )}
      </>
    );
  }

  const live = !archive;
  const weekly = isWeekPeriod(snapshot.period);
  const showAxes = chart !== "fan-pick";
  const wikiLang = WIKI_BY_LOCALE[locale];
  const ids = snapshot.items.map((i) => i.entityId);

  const [rising, fanPick, history, cheers, articles, weeks, firstPeriod] = await Promise.all([
    live && chart !== "fan-pick" ? getLatestSnapshot(chart, wikiLang) : null,
    live && chart !== "fan-pick" ? getLatestSnapshot("fan-pick") : null,
    live && !weekly ? listHistory(chart, "all", 30) : Promise.resolve([] as Snapshot[]),
    live ? todayCheers(ids) : Promise.resolve(new Map<string, number>()),
    live ? latestArticles(locale, snapshot.items.slice(HERO_UNTIL, 10)) : Promise.resolve(new Map()),
    listWeeklyPeriods(chart),
    getFirstPeriod(chart),
  ]);
  const risingItems = rising?.items.slice(0, 10) ?? [];
  const entities = await getEntities([
    ...ids,
    ...risingItems.map((i) => i.entityId),
    ...(fanPick?.items.slice(0, 3).map((i) => i.entityId) ?? []),
  ]);

  const top = snapshot.items[0]!;
  const nameOf = (i: (typeof snapshot.items)[number]) => displayName(i.names, locale, i.entityId);
  const subLang = locale === "ko" ? "en" : "ko";
  const languages = new Intl.DisplayNames([locale], { type: "language" });
  const sourceNames = snapshot.sources.map((s) => s.name.replace(/\s*\(.*\)\s*$/, ""));

  // 이 화면에 보인 사진 → 사진 출처 (CC 표시)
  const credits: { name: string; photo: EntityPhoto }[] = [];
  const credit = (item: (typeof snapshot.items)[number]) => {
    const photo = entities.get(item.entityId)?.photo;
    if (photo) credits.push({ name: nameOf(item), photo });
  };
  snapshot.items.forEach(credit);
  risingItems.forEach(credit);
  fanPick?.items.slice(0, 3).forEach(credit);

  const prefix = LOCALE_PATH_PREFIX[locale];
  const chartUrl = `${SITE_URL}${prefix}${chartPath(chart)}`;
  const pageUrl = archive ? `${SITE_URL}${prefix}${chartPath(chart, snapshot.period)}` : chartUrl;
  const jsonLd = chartJsonLd({
    snapshot,
    entities,
    locale,
    name: chartName,
    description: t(`chart.${CHART_KEY[chart]}.description`),
    pageUrl,
    chartUrl,
    methodologyUrl: `${SITE_URL}${prefix}/rankings/methodology`,
    firstPeriod,
    today: kstDay(),
    crumbs: [
      { name: SITE_NAME, url: `${SITE_URL}${prefix}` },
      { name: t("tab"), url: `${SITE_URL}${prefix}/rankings` },
      { name: chartName, url: chartUrl },
      ...(archive ? [{ name: periodLabel(snapshot.period, locale), url: pageUrl }] : []),
    ],
    nameOf,
    idolUrl: (slug) => `${SITE_URL}${prefix}/idol/${slug}`,
  });

  const dateTag = (chunks: ReactNode) => <time dateTime={periodDateTime(snapshot.period)}>{chunks}</time>;
  const dateLabel = periodLabel(snapshot.period, locale);

  return (
    <>
      {header}
      <JsonLd data={jsonLd} />

      <div className="px-gutter pt-6">
        <h1 className="text-st2 font-bold text-ink-900">{chartName}</h1>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-t7">
          <span className="rounded-full bg-fill-weak px-3 py-1 font-semibold text-ink-700">
            {weekly ? t.rich("weekOf", { date: dateLabel, time: dateTag }) : t.rich("asOf", { date: dateLabel, time: dateTag })}
          </span>
          <span className="text-ink-600">
            {chart === "fan-pick" ? t("fanPickNote") : archive ? t("weeklyArchive") : t("updatedDaily")}
          </span>
        </p>
        <p className="mt-2 text-t7 text-ink-600">
          {t("sources")}: {sourceNames.length > 0 ? sourceNames.join(" · ") : t("fanPickSource")}{" "}
          <Link href="/rankings/methodology" className="font-semibold whitespace-nowrap text-brand-ink">
            → {t("howCalculated")}
          </Link>
        </p>
        <p className="rank-answer mt-4 text-t5 font-medium text-ink-900">
          {answerSentence(t, snapshot, chartName, locale)}
        </p>
        {snapshot.correction && (
          <p className="mt-3 rounded-btn bg-surface-note px-3 py-2 text-t7 text-ink-700">
            {t("correction")}: {snapshot.correction}
          </p>
        )}
      </div>

      {pollCard}

      <RankHero
        chart={chart}
        item={top}
        name={nameOf(top)}
        subName={secondaryName(top.names, locale)}
        subLang={subLang}
        photo={entities.get(top.entityId)?.photo ?? null}
        tint={tint}
        score={formatScore(top.score, locale)}
        cheers={cheers.get(top.entityId) ?? 0}
        showAxes={showAxes}
        live={live}
      />

      <RankingList
        chart={chart}
        locale={locale}
        items={snapshot.items.slice(HERO_UNTIL, 30)}
        entities={entities}
        history={history}
        cheers={cheers}
        articles={articles}
        showAxes={showAxes}
        live={live}
      />

      {(risingItems.length > 0 || fanPick) && <div aria-hidden className="mt-6 h-4 bg-band" />}

      {risingItems.length > 0 && (
        <section aria-labelledby="rising">
          <SectionHeader id="rising" title={t("risingIn", { language: languages.of(wikiLang) ?? wikiLang })} />
          <p className="-mt-2 px-gutter pb-2 text-t7 text-ink-600">
            {t("risingNote", { language: languages.of(wikiLang) ?? wikiLang })}
          </p>
          <ol>
            {risingItems.map((item, i) => {
              const name = nameOf(item);
              const sub = secondaryName(item.names, locale);
              const slug = entities.get(item.entityId)?.slug;
              const row = (
                <>
                  <span className="w-6 shrink-0 text-center text-t5 font-bold tabular-nums text-ink-900">{i + 1}</span>
                  <EntityAvatar name={name} src={entities.get(item.entityId)?.photo?.avatar} tint={tint} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-t6 font-semibold text-ink-900">{name}</span>
                    {sub && (
                      <span lang={subLang} className="block truncate text-st12 text-ink-600">
                        {sub}
                      </span>
                    )}
                  </span>
                  <RankChange rank={item.rank} prevRank={item.prevRank} />
                </>
              );
              return (
                <li key={item.entityId}>
                  {slug ? (
                    <Link href={`/idol/${slug}`} className="press-row flex min-h-14 items-center gap-3 px-gutter py-2">
                      {row}
                    </Link>
                  ) : (
                    <div className="flex min-h-14 items-center gap-3 px-gutter py-2">{row}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {fanPick && fanPick.items.length > 0 && (
        <section aria-labelledby="fan-pick" className="px-gutter">
          <h2 id="fan-pick" className="pt-6 pb-3 text-t4 font-bold text-ink-900">
            {t("fanPickResult")}
          </h2>
          <RankingMiniCard
            chart="fan-pick"
            title={t("chart.fanPick.title")}
            snapshot={fanPick}
            entities={entities}
            locale={locale}
            as="h3"
          />
        </section>
      )}

      {weeks.length > 0 && (
        <nav aria-labelledby="archive" className="pt-6">
          <h2 id="archive" className="px-gutter pb-2 text-t6 font-semibold text-ink-600">
            {t("archive")}
          </h2>
          <ul className="rail gap-2 px-gutter pb-1">
            {weeks.map((p) => (
              <li key={p}>
                <Link
                  href={chartPath(chart, p)}
                  aria-current={archive && p === snapshot.period ? "page" : undefined}
                  className={`press inline-flex min-h-9 items-center rounded-full px-3 text-t7 font-semibold whitespace-nowrap tabular-nums ${
                    archive && p === snapshot.period ? "bg-brand-weak text-brand-ink" : "bg-fill-weak text-ink-700"
                  }`}
                >
                  {periodLabel(p, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <PhotoCredits credits={credits} />
    </>
  );
}
