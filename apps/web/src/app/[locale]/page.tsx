import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { SITE_NAME } from "@kmedia/core";

import { AdSlot } from "@/components/AdSlot";
import { PollCard } from "@/components/article/PollCard";
import { AppHeader } from "@/components/AppHeader";
import { EmptyMemo } from "@/components/EmptyMemo";
import { Feed } from "@/components/Feed";
import { CategoryIcons } from "@/components/home/CategoryIcons";
import { ContinueRail } from "@/components/home/ContinueRail";
import { GuideHero } from "@/components/home/GuideHero";
import { GuideTeaser } from "@/components/home/GuideTeaser";
import { TopStories, topStorySlugs } from "@/components/home/TopStories";
import { ChevronRightIcon } from "@/components/icons";
import { QuizBanner } from "@/components/quiz/QuizBanner";
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

// 시간이 지나도 다시 만들지 않는다. 글을 낼 때(announce)·KST 자정(일정 D-day)·05시 랭킹 뒤에 worker 가 비우고 바로 다시 요청한다.
// 봇이 DB 를 깨우지 않게 재생성은 파이프라인이 도는 동안에만 일어난다 (apps/worker/src/pipeline/refresh.ts)
export const revalidate = false;

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

  const [t, tSite, tNav, tRank, tArticle, rows, total, weeklyPoll, miniChart, topSlugs] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Site"),
    getTranslations("Nav"),
    getTranslations("Rankings"),
    getTranslations("Article"),
    listLatest(locale, FIRST_PAGE_SIZE),
    countLatest(locale),
    weeklyPollView(locale),
    homeMiniChart(),
    topStorySlugs(locale),
  ]);
  const items = await toFeedItems(rows, locale);

  // 끼워 넣는 모듈 (3장 간격): 3 가이드 소개(뷰티) → 6 이번 주 팬 투표 → 9 광고(승인 전엔 피부 진단 배너) →
  // 12 배우·드라마 차트 → 15 가이드 소개(여행) → 18 광고. 광고는 첫 화면에 두지 않고, 버튼 있는 모듈(투표) 바로 옆에 두지 않는다.
  // 내용이 없으면(투표가 닫혔거나 차트가 아직 없으면) 그 자리는 건너뛴다
  const rankingsRail: ReactNode = <BuzzTop5Rail locale={locale} />;
  const slots: Record<number, ReactNode> = {
    3: <GuideTeaser section="beauty" locale={locale} />,
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
    9: (
      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_1}
        fallback={<QuizBanner locale={locale} />}
        className="my-3"
      />
    ),
    15: <GuideTeaser section="travel" locale={locale} />,
    18: <AdSlot label={tArticle("ad")} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_2} className="my-3" />,
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

  // 홈 = 오늘의 소식. 3D 아이콘 카테고리 → 지금 많이 읽는 글(사진 카드 + 3줄) → 일정 → 가이드 2×2 → (다시 온 독자) 이어 읽기 → (랭킹) → 이번 주 인기 5개 → 최신 피드 → 더 보기.
  // 섹션 제목은 모두 위 24·아래 12
  return (
    <>
      <AppHeader />
      <h1 className="sr-only">
        {SITE_NAME} — {tSite("tagline")}
      </h1>
      <CategoryIcons locale={locale} />
      <TopStories locale={locale} />
      <UpcomingRail locale={locale} />
      <GuideHero locale={locale} />
      <ContinueRail />
      {rankingsRail}
      <TrendingNow locale={locale} exclude={topSlugs} />
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
