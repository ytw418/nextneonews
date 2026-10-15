import { type EventWithView, kst, type Locale } from "@kmedia/core";
import { getTranslations } from "next-intl/server";

import { DdayBadge } from "@/components/ui/DdayBadge";
import { ListRow } from "@/components/ui/ListRow";
import { keepDots, Meta } from "@/components/ui/Meta";
import { ddayLabel, eventAriaLabel, KIND_TINT } from "@/lib/schedule";

// 일정 목록 한 줄: 왼쪽 날짜 칸(이벤트 틴트) · 이름과 '종류 · 도시' · D-day 배지와 꺾쇠. 줄 전체가 상세로 가는 링크
// 날짜 칸은 '20–21' 같은 기간도 들어가는 폭으로 모두 같게 (칸 폭이 달라 줄마다 제목 시작 x 가 어긋났다).
// rem 이라 글자를 키우면 숫자와 함께 넓어지되, 숫자는 28px 에서 멈춘다 (AX3 에서 칸이 140px 까지 커졌다).
// 글자를 키워 줄 폭이 20rem 보다 좁아지면 D-day 배지는 오른쪽 대신 메타 줄 끝으로 (탭바 옆에 혼자 떨어졌다)
export async function EventRow({ e, locale }: { e: EventWithView; locale: Locale }) {
  const t = await getTranslations("Schedule");
  const start = kst(e.start);
  const month = new Intl.DateTimeFormat(locale, { timeZone: "Asia/Seoul", month: "short" }).format(start);
  const day = (d: string) => Number(d.slice(8, 10));
  const days = e.end && e.end !== e.start ? `${day(e.start)}–${day(e.end)}` : String(day(e.start));
  const city = e.city?.[locale];
  const meta = [
    t(`kind.${e.kind}`),
    city,
    e.releases?.length ? t("releaseCount", { count: e.releases.length }) : undefined,
  ];
  const badge = <DdayBadge view={e.view} label={ddayLabel(e.view, t)} />;

  return (
    <ListRow
      href={`/schedule/${e.id}`}
      ariaLabel={eventAriaLabel({ e, view: e.view, locale, t })}
      arrow
      left={
        <span
          aria-hidden
          className={`flex min-h-13 min-w-[min(3.5rem,72px)] flex-col items-center justify-center rounded-btn px-1 text-on-tint ${
            e.view.state === "ended" ? "opacity-60" : ""
          }`}
          style={{ backgroundColor: KIND_TINT[e.kind] }}
        >
          <span className="text-date-month font-semibold uppercase text-on-tint-sub">{month}</span>
          <span className={`font-bold tabular-nums ${days.includes("–") ? "text-date-range" : "text-date-day"}`}>
            {days}
          </span>
        </span>
      }
      title={keepDots(e.name)}
      sub={
        <>
          <Meta parts={meta} />
          <span className="hidden @max-[20rem]:inline">
            {" "}
            {badge}
          </span>
        </>
      }
      right={<span className="@max-[20rem]:hidden">{badge}</span>}
    />
  );
}
