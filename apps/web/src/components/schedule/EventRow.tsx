import { type EventWithView, kst, type Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { DdayBadge } from "@/components/ui/DdayBadge";
import { ListRow } from "@/components/ui/ListRow";
import { ddayLabel, eventAriaLabel, KIND_TINT } from "@/lib/schedule";

// 일정 목록 한 줄: 왼쪽 날짜 칸(이벤트 틴트) · 이름과 '종류 · 도시' · D-day 배지와 꺾쇠. 줄 전체가 상세로 가는 링크
export async function EventRow({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  const start = kst(e.start);
  const month = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", month: "short" }).format(start);
  const day = (d: string) => Number(d.slice(8, 10));
  const days = e.end && e.end !== e.start ? `${day(e.start)}–${day(e.end)}` : String(day(e.start));
  const city = e.city?.[locale];
  const sub = [
    t(`kind.${e.kind}`),
    city,
    e.releases?.length ? t("releaseCount", { count: e.releases.length }) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ListRow
      href={`/schedule/${e.id}`}
      ariaLabel={eventAriaLabel({ e, view: e.view, locale, t })}
      arrow
      left={
        <span
          aria-hidden
          className={`flex min-h-13 min-w-13 flex-col items-center justify-center rounded-btn px-1 text-on-tint ${
            e.view.state === "ended" ? "opacity-60" : ""
          }`}
          style={{ backgroundColor: KIND_TINT[e.kind] }}
        >
          <span className="text-st13 font-semibold uppercase text-on-tint-sub">{month}</span>
          <span className={`font-bold tabular-nums ${days.includes("–") ? "text-t6" : "text-t4"}`}>{days}</span>
        </span>
      }
      title={e.name}
      sub={sub}
      right={<DdayBadge view={e.view} label={ddayLabel(e.view, t)} />}
    />
  );
}
