import { listUpcoming } from "@kmedia/core";
import { prisma } from "@kmedia/db";
import { getTranslations } from "next-intl/server";

import { ArticleThumb } from "@/components/ArticleThumb";
import { type FeedItem, FeedCard, itemTime } from "@/components/FeedCard";
import { MyPicks } from "@/components/home/MyPicks";
import { ChevronRightIcon } from "@/components/icons";
import { Phrase } from "@/components/Phrase";
import { THUMB_LARGE_TEXT } from "@/components/RankedArticles";
import { Badge } from "@/components/ui/Badge";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Link } from "@/i18n/navigation";
import { pickCandidates } from "@/lib/home-picks";
import { ddayLabel, ddayTone } from "@/lib/schedule";

// 홈 첫 화면의 '오늘' 묶음: 날짜 줄 → 내 최애 → 오늘의 탑 기사. 매일 같은 가이드 카드 대신 열자마자 '오늘 새로 볼 것'이 보이게 한다.
// 홈은 글을 낼 때와 KST 자정에 다시 만들어지므로(page.tsx revalidate) 날짜·오늘 글 수·D-day 를 서버에서 그려도 하루 안에 맞는다

// 오늘(KST 0시부터) 이 언어로 나온 글 수
async function countToday(locale: string): Promise<number> {
  const kstMidnight = new Date(`${new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10)}T00:00:00+09:00`);
  return prisma.translation.count({
    where: { locale, article: { status: "PUBLISHED", publishedAt: { gte: kstMidnight } } },
  });
}

// 날짜 줄: '10월 22일 (수) · 오늘 새 글 12' 와 가장 가까운 일정 D-day 알약 (30일 안만)
export async function TodayStrip({ locale }: { locale: string }) {
  const [t, tSchedule, count] = await Promise.all([
    getTranslations("Today"),
    getTranslations("Schedule"),
    countToday(locale),
  ]);
  const date = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date());
  const next = listUpcoming().find((e) => e.view.state !== "upcoming" || e.view.days <= 30);
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-gutter pt-3">
      <p className="text-t6 text-ink-600">
        <span className="font-bold text-ink-900">{date}</span>
        {count > 0 && <> · {t("newToday", { count })}</>}
      </p>
      {next && (
        <Link href={`/schedule/${next.id}`} className="press inline-flex min-h-8 items-center gap-1.5">
          <Badge tone={ddayTone(next.view)}>{ddayLabel(next.view, tSchedule)}</Badge>
          <span className="max-w-[11rem] truncate text-t7 font-semibold text-ink-700">{next.name}</span>
          <ChevronRightIcon className="size-3.5 text-ink-400" />
        </Link>
      )}
    </div>
  );
}

// 내 최애: 후보(차트 위쪽 얼굴)와 그 사람의 최신 글·D-day 를 서버에서 붙여 클라이언트 줄에 넘긴다
export async function HomePicks({ locale }: { locale: string }) {
  const [candidates, tSchedule] = await Promise.all([pickCandidates(locale), getTranslations("Schedule")]);
  return (
    <MyPicks
      candidates={candidates.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        avatar: c.avatar,
        tint: c.tint,
        latest: c.latest,
        dday:
          c.event && (c.event.view.state !== "upcoming" || c.event.view.days <= 30)
            ? {
                label: ddayLabel(c.event.view, tSchedule),
                hot: ddayTone(c.event.view) === "brand",
                name: c.event.name,
              }
            : null,
      }))}
    />
  );
}

// 오늘의 탑 기사: 1위는 사진 큰 카드, 2·3위는 번호 줄. 아래 최신 피드는 이 글들을 빼고 그린다
export async function TopStories({ items, locale }: { items: FeedItem[]; locale: string }) {
  if (items.length === 0) return null;
  const t = await getTranslations("Today");
  const [lead, ...rest] = items;
  return (
    <section aria-labelledby="home-top" className="@container">
      <SectionHeader id="home-top" title={t("top")} />
      <div className="px-gutter">
        <FeedCard item={lead!} variant="lead" priority />
      </div>
      {rest.length > 0 && (
        <ol start={2} className="mt-1">
          {rest.map((item, i) => (
            <ListRow
              key={item.slug}
              href={`/news/${item.slug}`}
              titleWeight="semibold"
              left={
                <span className="flex items-center gap-3">
                  <span className="min-w-6 text-center text-t4 font-bold tabular-nums text-ink-900">{i + 2}</span>
                  <span className={THUMB_LARGE_TEXT}>
                    <ArticleThumb item={item} size={48} />
                  </span>
                </span>
              }
              title={
                <span className="line-clamp-2 @max-[20rem]:line-clamp-3">
                  <Phrase text={item.title} locale={locale} />
                </span>
              }
              sub={
                <span className="text-t7">
                  <Meta parts={[item.categoryLabel, itemTime(item)]} />
                </span>
              }
            />
          ))}
        </ol>
      )}
    </section>
  );
}
