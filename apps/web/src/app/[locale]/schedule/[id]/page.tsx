import {
  eventState,
  findEvent,
  formatRange,
  googleCalendarUrl,
  isLocale,
  kst,
  type Locale,
  LOCALE_PATH_PREFIX,
  ticketOpen,
  UPCOMING,
} from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { ArticleThumb } from "@/components/ArticleThumb";
import { type FeedItem, itemTime } from "@/components/FeedCard";
import { ExternalIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { Phrase } from "@/components/Phrase";
import { AddToCalendarButton } from "@/components/schedule/AddToCalendarButton";
import { EventHero } from "@/components/schedule/EventHero";
import { FixedBottomCTA } from "@/components/schedule/FixedBottomCTA";
import { InfoRows } from "@/components/schedule/InfoRows";
import { Lineup } from "@/components/schedule/Lineup";
import { WatchTickets } from "@/components/schedule/WatchTickets";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/Button";
import { ListRow } from "@/components/ui/ListRow";
import { Meta } from "@/components/ui/Meta";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listForEvent, toFeedItems } from "@/lib/articles";
import { eventJsonLd } from "@/lib/jsonld";
import { localeAlternates, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 일정 파일(packages/core/src/upcoming.ts)에 있는 일정만 빌드 때 만든다. 관련 뉴스가 DB 를 읽어 시간 기반으로는 다시 만들지 않고,
// D-day 가 바뀌는 KST 자정 뒤 첫 파이프라인과 05시에 worker 가 비우고 바로 다시 요청한다 (refresh date·day)
export const revalidate = false;
export const dynamicParams = false;

export function generateStaticParams() {
  return UPCOMING.map((e) => ({ id: e.id }));
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function generateMetadata({ params }: PageProps<"/[locale]/schedule/[id]">): Promise<Metadata> {
  const { locale, id } = await params;
  const e = findEvent(id);
  if (!e || !isLocale(locale)) return {};
  const t = await getTranslations({ locale, namespace: "Schedule" });
  const city = e.city?.[locale];
  const title = `${e.name} — ${formatRange(locale, e.start, e.end, "short")}${city ? ` · ${city}` : ""}`;
  const description =
    e.about?.[locale] ??
    `${t(`kind.${e.kind}`)} · ${formatRange(locale, e.start, e.end, "long")}${e.venue ? ` · ${e.venue}` : ""}`;
  const alternates = localeAlternates(locale, `/schedule/${id}`);
  return {
    title,
    description,
    alternates,
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

// 관련 뉴스: 이 일정 키워드가 나오는 최근 글 3개
function RelatedNews({ items, locale, title }: { items: FeedItem[]; locale: Locale; title: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby="related-news">
      <SectionHeader id="related-news" title={title} />
      <ul>
        {items.map((item) => (
          <ListRow
            key={item.slug}
            href={`/news/${item.slug}`}
            titleWeight="semibold"
            left={<ArticleThumb item={item} size={56} />}
            title={<Phrase text={item.title} locale={locale} />}
            sub={
              <span className="text-t7">
                <Meta parts={[item.categoryLabel, itemTime(item)]} />
              </span>
            }
          />
        ))}
      </ul>
    </section>
  );
}

export default async function EventPage({ params }: PageProps<"/[locale]/schedule/[id]">) {
  const { locale, id } = await params;
  const found = findEvent(id);
  if (!found || !isLocale(locale)) notFound();
  setRequestLocale(locale);

  const now = new Date();
  const e = { ...found, view: eventState(found, now) };
  const ended = e.view.state === "ended";
  const [t, tArticle, rows] = await Promise.all([
    getTranslations("Schedule"),
    getTranslations("Article"),
    listForEvent(locale, e),
  ]);
  const related = await toFeedItems(rows, locale);
  const url = `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}/schedule/${id}`;
  const jsonLd = eventJsonLd(e, locale, url);
  const openTicket = e.tickets?.find((ticket) => ticketOpen(ticket, now));
  const checked = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", dateStyle: "medium" }).format(
    kst(e.checkedAt),
  );
  const addToCalendar = (className?: string) => (
    <AddToCalendarButton
      icsHref={`/api/calendar/${locale}/${id}`}
      googleHref={googleCalendarUrl(e, locale, url)}
      label={t("addToCalendar")}
      block={!className}
      className={className}
    />
  );
  const relatedNews = <RelatedNews items={related} locale={locale} title={t("related")} />;

  return (
    <>
      <AppHeader
        variant="pushed"
        parentHref="/schedule"
        title={e.name}
        action={<ShareButton title={e.name} label={t("share")} copiedLabel={tArticle("copied")} />}
      />
      {jsonLd && <JsonLd data={jsonLd} />}

      <EventHero e={e} locale={locale} />
      {/* 끝난 일정은 관련 뉴스가 먼저 (지난 행사는 소식이 궁금하다) */}
      {ended && relatedNews}
      <InfoRows e={e} locale={locale} />
      <WatchTickets e={e} locale={locale} />
      <Lineup e={e} locale={locale} />
      {!ended && relatedNews}

      <div aria-hidden className="mt-6 h-4 bg-band" />
      <section aria-labelledby="event-sources">
        <SectionHeader id="event-sources" title={t("sources")} />
        <ul>
          {e.sources.map((source) => (
            <ListRow key={source} external href={source} titleWeight="medium" title={hostname(source)} />
          ))}
        </ul>
        <p className="px-gutter pt-2 pb-6 text-t7 text-ink-600">{t("checked", { date: checked })}</p>
      </section>

      {!ended && (
        <FixedBottomCTA>
          {openTicket?.url ? (
            // 둘은 늘 나란히: 글자를 키우면 버튼 안에서 줄을 바꾼다 (쌓이면 화면 1/4 을 먹었다)
            <div className="flex gap-2">
              <Button size="xl" variant="weak" href={openTicket.url} external className="min-w-0 flex-auto py-2">
                {t("getTickets")}
                <ExternalIcon className="size-4 shrink-0" />
              </Button>
              {addToCalendar("min-w-0 flex-auto py-2")}
            </div>
          ) : (
            addToCalendar()
          )}
        </FixedBottomCTA>
      )}
    </>
  );
}
