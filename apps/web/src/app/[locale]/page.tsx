import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { SITE_NAME } from "@kmedia/core";

import { PollCard } from "@/components/article/PollCard";
import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { EmptyMemo } from "@/components/EmptyMemo";
import { Feed } from "@/components/Feed";
import { GuideRail } from "@/components/guide/GuideRail";
import { PopularChips } from "@/components/home/PopularChips";
import { ChevronRightIcon } from "@/components/icons";
import { BuzzTop5Rail } from "@/components/rankings/BuzzTop5Rail";
import { RankingMiniCard } from "@/components/rankings/RankingMiniCard";
import { TrendingNow } from "@/components/TrendingNow";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { UpcomingRail } from "@/components/UpcomingRail";
import { Link } from "@/i18n/navigation";
import { countLatest, listLatest, toFeedItems } from "@/lib/articles";
import { weeklyPollView } from "@/lib/engagement";
import { FIRST_PAGE_SIZE, pageCount } from "@/lib/feed";
import { CHART_KEY, getEntities, getLatestSnapshot } from "@/lib/rankings";
import { localeAlternates, ogBase } from "@/lib/url";

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Site" });
  const title = `${SITE_NAME} — ${t("tagline")}`;
  const alternates = localeAlternates(locale);
  return {
    title: { absolute: title },
    description: t("tagline"),
    alternates,
    openGraph: { ...ogBase(locale), type: "website", url: alternates.canonical, title, description: t("tagline") },
    twitter: { card: "summary_large_image" },
  };
}

// 홈 12번째 자리 차트: K-pop 은 위 레일에 있으니 배우 → 드라마 순으로 3명 이상 오른 첫 차트
async function homeMiniChart() {
  for (const chart of ["actors", "kdrama"] as const) {
    const snapshot = await getLatestSnapshot(chart);
    if (snapshot && snapshot.items.length >= 3) {
      const entities = await getEntities(snapshot.items.slice(0, 3).map((i) => i.entityId));
      return { chart, snapshot, entities };
    }
  }
  return null;
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tSite, tNav, tRank, rows, total, weeklyPoll, miniChart] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Site"),
    getTranslations("Nav"),
    getTranslations("Rankings"),
    listLatest(locale, FIRST_PAGE_SIZE),
    countLatest(locale),
    weeklyPollView(locale),
    homeMiniChart(),
  ]);
  const items = await toFeedItems(rows, locale);

  // 끼워 넣는 모듈: 일정 아래 K-pop 화제성 Top5 레일, 피드 6번째 뒤 이번 주 팬 투표, 12번째 뒤 배우·드라마 차트 카드.
  // 내용이 없으면(투표가 닫혔거나 차트가 아직 없으면) 그 자리는 건너뛴다
  const rankingsRail: ReactNode = <BuzzTop5Rail locale={locale} />;
  const slots: Record<number, ReactNode> = {
    6: weeklyPoll && (
      <PollCard
        poll={weeklyPoll}
        locale={locale}
        anchorId="weekly-poll"
        className=""
        kicker={
          <Link href="/rankings/fan-pick" className="inline-flex min-h-6 items-center gap-0.5">
            {tRank("chart.fanPick.title")}
            <ChevronRightIcon className="size-3.5" />
          </Link>
        }
      />
    ),
    12: miniChart && (
      <RankingMiniCard
        chart={miniChart.chart}
        title={tRank(`chart.${CHART_KEY[miniChart.chart]}.title`)}
        snapshot={miniChart.snapshot}
        entities={miniChart.entities}
        locale={locale}
      />
    ),
  };

  // 아직 글이 없는 언어(새로 연 언어): '최신' 제목 없이 메모 한 장 — 영어로 읽기와 일정으로 보낸다
  const empty = (
    <EmptyMemo text={t("comingSoon")} tint="var(--tint-kpop)">
      {locale !== "en" && (
        <Button size="m" variant="weak" href="/" locale="en" className="bg-white/70! dark:bg-black/25!">
          {t("readInEnglish")}
        </Button>
      )}
      <Link
        href="/schedule"
        className="press inline-flex min-h-11 items-center gap-0.5 text-t6 font-semibold text-on-tint"
      >
        {tNav("schedule")}
        <ChevronRightIcon className="size-4 text-on-tint-sub" />
      </Link>
    </EmptyMemo>
  );

  // 홈 = 오늘의 소식. 칩 → 많이 읽는 번호 알약 → 일정 티켓 5개 → 가이드 4칸 → (랭킹) → 이번 주 인기 5개 → 최신 피드 → 더 보기.
  // 섹션 제목은 모두 위 24·아래 12
  return (
    <>
      <AppHeader />
      <h1 className="sr-only">
        {SITE_NAME} — {tSite("tagline")}
      </h1>
      <CategoryRail />
      <PopularChips locale={locale} />
      <UpcomingRail locale={locale} />
      <GuideRail locale={locale} />
      {rankingsRail}
      <TrendingNow locale={locale} />
      {items.length > 0 && <SectionHeader title={t("latest")} />}
      <Feed
        items={items}
        slots={slots}
        paging={{ locale, page: 1, lastPage: pageCount(total) }}
        empty={empty}
      />
    </>
  );
}
