import { isLocale, listPast, listUpcoming, LOCALE_PATH_PREFIX, monthGroups } from "@kmedia/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AppHeader } from "@/components/AppHeader";
import { ChevronDownIcon } from "@/components/icons";
import { JsonLd } from "@/components/JsonLd";
import { EventRow } from "@/components/schedule/EventRow";
import { scheduleJsonLd } from "@/lib/jsonld";
import { localeAlternates, localeHomePath, ogBase, SITE_URL } from "@/lib/url";

// D-day 가 KST 자정에 바뀌니 한 시간마다 다시 만든다
export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/[locale]/schedule">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Schedule" });
  const alternates = localeAlternates(locale, "/schedule");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates,
    openGraph: {
      ...ogBase(locale),
      type: "website",
      url: alternates.canonical,
      title: t("metaTitle"),
      description: t("metaDescription"),
      images: [`${localeHomePath(locale)}/opengraph-image`],
    },
    twitter: { card: "summary_large_image" },
  };
}

// 일정 탭: 다가오는 일정을 달별로, 끝난 일정은 맨 아래 접어서
export default async function SchedulePage({ params }: PageProps<"/[locale]/schedule">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [t, tNav] = await Promise.all([getTranslations("Schedule"), getTranslations("Nav")]);
  const now = new Date();
  const upcoming = listUpcoming(now);
  const past = listPast(now);
  const groups = monthGroups(upcoming, locale, now);

  return (
    <>
      {/* 큰 제목이 보이는 동안은 홈처럼 로고, 바 밑으로 올라가면 가운데 제목 */}
      <AppHeader title={tNav("schedule")} />
      <JsonLd
        data={scheduleJsonLd(
          upcoming.map((e) => ({ name: e.name, url: `${SITE_URL}${LOCALE_PATH_PREFIX[locale]}/schedule/${e.id}` })),
        )}
      />

      <div className="px-gutter pt-6 pb-6">
        <h1 className="text-st2 font-bold text-ink-900">{tNav("schedule")}</h1>
        <p className="mt-1 text-t6 text-ink-600">{t("kstNote")}</p>
      </div>

      {groups.length > 0 ? (
        groups.map((g, i) => (
          <section key={g.key} aria-labelledby={`m-${g.key}`}>
            <h2 id={`m-${g.key}`} className={`px-gutter pb-2 text-t6 font-semibold text-ink-600 ${i > 0 ? "pt-6" : ""}`}>
              {g.label}
            </h2>
            <ul className="@container">
              {g.events.map((e) => (
                <EventRow key={e.id} e={e} locale={locale} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="px-8 py-16 text-center text-t5 font-medium text-ink-700">{t("empty")}</p>
      )}

      {past.length > 0 && (
        <>
          <div aria-hidden className="mt-6 h-4 bg-band" />
          {/* 다가오는 일정이 없으면 펼쳐 둔다 (빈 화면 대신 지난 일정을 바로 보여 준다) */}
          <details className="group" open={groups.length === 0}>
            <summary className="press-row flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-gutter text-t5 font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
              {t("past", { count: past.length })}
              <ChevronDownIcon className="size-5 shrink-0 text-ink-400 transition-transform duration-200 ease-expo group-open:rotate-180" />
            </summary>
            <ul className="@container">
              {past.map((e) => (
                <EventRow key={e.id} e={e} locale={locale} />
              ))}
            </ul>
          </details>
        </>
      )}
    </>
  );
}
