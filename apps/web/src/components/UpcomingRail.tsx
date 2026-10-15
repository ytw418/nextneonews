import { daysUntil, isLocale, UPCOMING } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { SectionHeader } from "@/components/ui/SectionHeader";

// 콘서트 티켓 모양의 D-day 레일. 스텁 색은 일정 종류(이벤트 틴트)를 뜻한다
export async function UpcomingRail({ locale }: { locale: string }) {
  const t = await getTranslations("Home");
  const events = UPCOMING.filter((e) => daysUntil(e.end ?? e.start) >= 0).slice(0, 8);
  if (events.length === 0) return null;
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric", timeZone: "UTC" });

  return (
    // 하단 탭의 '/#upcoming' 이 여기로 온다
    <section id="upcoming" aria-labelledby="home-schedule">
      <SectionHeader id="home-schedule" title={t("upcoming")} />
      <ul className="rail rail-snap items-stretch gap-2 px-gutter pb-1">
        {events.map((e) => {
          const days = Math.max(0, daysUntil(e.start));
          const urgent = days >= 1 && days <= 7;
          const place = isLocale(locale) ? e.place[locale] : e.place.en;
          return (
            <li
              key={e.id}
              className="flex w-[min(max(9rem,calc((min(100vw,640px)-36px)/2.25)),calc(100vw-56px))] flex-col overflow-hidden rounded-card bg-card shadow-card"
            >
              <div
                className="ticket-stub flex flex-col px-4 pt-4 pb-3"
                style={{ backgroundColor: `var(--tint-event-${e.kind})` }}
              >
                {days === 0 ? (
                  <p className="text-t3 font-bold text-on-tint">
                    <span className="text-t5">
                      <span className="mr-1.5 inline-block size-2 rounded-full bg-cherry align-middle" />
                      {t("today")}
                    </span>
                  </p>
                ) : (
                  <p
                    className={`whitespace-nowrap text-t3 font-bold tabular-nums ${urgent ? "text-brand-ink" : "text-on-tint"}`}
                  >
                    {t("dday", { days })}
                  </p>
                )}
                <p className="text-t6 font-semibold tabular-nums text-on-tint-sub">
                  {dateFormat.format(new Date(`${e.start}T00:00:00Z`))}
                  {e.end ? `–${dateFormat.format(new Date(`${e.end}T00:00:00Z`))}` : ""}
                </p>
              </div>
              <div className="flex flex-1 flex-col px-4 pt-3 pb-4">
                <p className="text-t5 leading-row font-bold text-ink-900">{e.name}</p>
                <p className="mt-1 text-t6 text-ink-600">{place}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
