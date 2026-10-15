import { daysUntil, isLocale, UPCOMING } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

const STUB = ["var(--tint-kpop)", "var(--tint-wh)", "var(--tint-kfood)", "var(--tint-travel)", "var(--tint-kdrama)"];

// 콘서트 티켓 모양의 D-day 레일
export async function UpcomingRail({ locale }: { locale: string }) {
  const t = await getTranslations("Home");
  const events = UPCOMING.filter((e) => daysUntil(e.end ?? e.start) >= 0).slice(0, 8);
  if (events.length === 0) return null;
  const dateFormat = new Intl.DateTimeFormat(locale, { month: "numeric", day: "numeric", timeZone: "UTC" });

  return (
    <section id="upcoming" className="scroll-mt-16 pt-1">
      <h2 className="px-4 font-display text-[20px] italic">{t("upcoming")}</h2>
      <div className="rail gap-2 px-4 pb-1 pt-2">
        {events.map((e, i) => {
          const days = Math.max(0, daysUntil(e.start));
          const place = isLocale(locale) ? e.place[locale] : e.place.en;
          return (
            <div
              key={e.id}
              className="ticket rise flex w-[112px] flex-col rounded-[12px] px-2.5 pb-2.5 pt-2 text-ink"
              style={{ backgroundColor: STUB[i % STUB.length], ["--i" as string]: i }}
            >
              <span className="font-label text-[21px] font-extrabold leading-none tracking-[-0.03em]">
                {days === 0 ? t("today") : `D-${days}`}
              </span>
              <span className="mt-0.5 font-label text-[10.5px] font-semibold text-ink/60">
                {dateFormat.format(new Date(`${e.start}T00:00:00Z`))}
                {e.end ? `–${dateFormat.format(new Date(`${e.end}T00:00:00Z`))}` : ""}
              </span>
              <span className="mt-2.5 line-clamp-2 border-t border-dashed border-ink/25 pt-1.5 text-[11.5px] font-bold leading-tight">
                {e.name}
              </span>
              <span className="text-[10.5px] text-ink/60">{place}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
