import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { SITE_NAME } from "@kmedia/core";

import { AppHeader } from "@/components/AppHeader";
import { CategoryRail } from "@/components/CategoryRail";
import { EmptyMemo } from "@/components/EmptyMemo";
import { Feed } from "@/components/Feed";
import { PopularChips } from "@/components/home/PopularChips";
import { ChevronRightIcon } from "@/components/icons";
import { TrendingNow } from "@/components/TrendingNow";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { UpcomingRail } from "@/components/UpcomingRail";
import { Link } from "@/i18n/navigation";
import { countLatest, listLatest } from "@/lib/articles";
import { FIRST_PAGE_SIZE, pageCount, toFeedItems } from "@/lib/feed";
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

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, tSite, tNav, rows, total] = await Promise.all([
    getTranslations("Home"),
    getTranslations("Site"),
    getTranslations("Nav"),
    listLatest(locale, FIRST_PAGE_SIZE),
    countLatest(locale),
  ]);
  const items = await toFeedItems(rows, locale);

  // 끼워 넣는 모듈 자리. 랭킹 레일(BuzzTop5Rail)과 피드 사이 카드(6 = 주간 투표, 12 = 랭킹 카드)는 랭킹 작업이 채운다
  const rankingsRail: ReactNode = null;
  const slots: Record<number, ReactNode> = {};

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

  // 홈 = 오늘의 소식. 칩 → 많이 읽는 번호 알약 → 일정 티켓 5개 → (랭킹) → 이번 주 인기 5개 → 최신 피드 → 더 보기.
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
