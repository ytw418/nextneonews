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
import { ChevronRightIcon } from "@/components/icons";
import { QuizBanner } from "@/components/quiz/QuizBanner";
import { BuzzTop5Rail } from "@/components/rankings/BuzzTop5Rail";
import { RankingMiniCard } from "@/components/rankings/RankingMiniCard";
import { RecentComments } from "@/components/RecentComments";
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

  const [t, tSite, tNav, tRank, tArticle, rows, total, weeklyPoll, miniChart] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Site"),
    getTranslations("Nav"),
    getTranslations("Rankings"),
    getTranslations("Article"),
    listLatest(locale, FIRST_PAGE_SIZE),
    countLatest(locale),
    weeklyPollView(locale),
    homeMiniChart(),
  ]);
  const items = await toFeedItems(rows, locale);

  // 최신 피드 사이에 끼워 넣는 모듈 (3장 간격). 첫 화면은 가이드 → 최신 글이고, 참여 모듈(실시간 인기·댓글·투표)을 앞쪽에 둔다.
  // 2 실시간 인기 → 5 K-pop 화제성 → 8 방금 달린 댓글 → 11 광고(승인 전엔 피부 진단) → 14 팬 투표 → 17 일정 →
  // 20 배우·드라마 차트 → 23 가이드 소개(여행) → 26 광고 → 29 가이드 소개(뷰티). 광고는 첫 화면·버튼 있는 모듈(투표) 바로 옆에 두지 않는다.
  // 가로 레일·순위표는 자기 여백(gutter)이 있어 슬롯 여백을 되돌린다(-mx-gutter). 내용이 없는 모듈은 그 자리를 건너뛴다
  const bleed = (node: ReactNode) => <div className="-mx-gutter">{node}</div>;
  const slots: Record<number, ReactNode> = {
    2: bleed(<TrendingNow locale={locale} />),
    5: bleed(<BuzzTop5Rail locale={locale} />),
    8: bleed(<RecentComments locale={locale} />),
    14: weeklyPoll && (
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
    17: bleed(<UpcomingRail locale={locale} />),
    20: miniChart && (
      <RankingMiniCard
        chart={miniChart.chart}
        title={tRank(`chart.${CHART_KEY[miniChart.chart]}.title`)}
        snapshot={miniChart.snapshot}
        entities={miniChart.entities}
        locale={locale}
      />
    ),
    11: (
      <AdSlot
        label={tArticle("ad")}
        slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_1}
        fallback={<QuizBanner locale={locale} />}
        className="my-3"
      />
    ),
    23: <GuideTeaser section="travel" locale={locale} />,
    26: <AdSlot label={tArticle("ad")} slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_2} className="my-3" />,
    29: <GuideTeaser section="beauty" locale={locale} />,
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

  // 홈 = 3D 아이콘 카테고리 → 가이드 2×2(제휴) → (다시 온 독자) 이어 읽기 → 최신 피드(모듈·광고를 사이에) → 더 보기.
  // 섹션 제목은 모두 위 24·아래 12
  return (
    <>
      <AppHeader />
      <h1 className="sr-only">
        {SITE_NAME} — {tSite("tagline")}
      </h1>
      <CategoryIcons locale={locale} />
      <GuideHero locale={locale} />
      <ContinueRail />
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
