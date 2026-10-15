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
import type { FeedItem } from "@/components/FeedCard";
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
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listForEvent } from "@/lib/articles";
import { toFeedItems } from "@/lib/feed";
import { eventJsonLd } from "@/lib/jsonld";
import { localeAlternates, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// 일정 파일(packages/core/src/upcoming.ts)에 있는 일정만 빌드 때 만든다. D-day 때문에 한 시간마다 다시 만든다
export const revalidate = 3600;
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
            sub={<span className="text-t7">{`${item.categoryLabel} · ${item.timeAgo}`}</span>}
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
            // 둘이 한 줄에 안 들어가면 주 버튼(캘린더)이 엄지 가까운 아랫줄로 내려간다
            <div className="flex flex-wrap gap-2">
              <Button size="xl" variant="weak" href={openTicket.url} external className="flex-auto">
                {t("getTickets")}
                <ExternalIcon className="size-4 shrink-0" />
              </Button>
              {addToCalendar("flex-auto")}
            </div>
          ) : (
            addToCalendar()
          )}
        </FixedBottomCTA>
      )}
    </>
  );
}
