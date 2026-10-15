import {
  type EventKind,
  type EventView,
  kst,
  type Locale,
  type TicketLink,
  ticketState,
  type UpcomingEvent,
} from "@kmedia/core";

import type { BadgeTone } from "@/components/ui/Badge";

// 일정 화면 전용 얇은 도우미 (번역·CSS 변수가 필요한 것만). 날짜 계산은 @kmedia/core 에 둔다.
// DdayView 는 core 의 eventState() 결과에서 state·days 만 쓴다
export type DdayView = Pick<EventView, "state" | "days">;

// 'Schedule' 네임스페이스 번역 함수 (getTranslations·useTranslations 둘 다 받는다)
type Translate = (key: string, values?: Record<string, string | number>) => string;

// 스텁·날짜 칸 색은 일정 종류(이벤트 틴트). 카테고리 틴트와 섞지 않는다
export const KIND_TINT: Record<EventKind, string> = {
  comeback: "var(--tint-event-comeback)",
  awards: "var(--tint-event-awards)",
  concert: "var(--tint-event-concert)",
  festival: "var(--tint-event-festival)",
  fanmeeting: "var(--tint-event-fanmeeting)",
  drama: "var(--tint-event-drama)",
};

// 'D-36' (fr 'J-36') · '오늘' · '진행 중' · '종료'
export function ddayLabel(view: DdayView, t: Translate): string {
  return view.state === "upcoming" ? t("dday", { days: view.days }) : t(view.state);
}

// 채운 배지는 오늘·진행 중·D-1~D-7 만. D-8~D-30 은 옅게, 그 뒤와 끝난 일정은 회색
export function ddayTone(view: DdayView): Extract<BadgeTone, "brand" | "brandWeak" | "neutral"> {
  if (view.state === "today" || view.state === "ongoing") return "brand";
  if (view.state === "ended") return "neutral";
  if (view.days <= 7) return "brand";
  if (view.days <= 30) return "brandWeak";
  return "neutral";
}

// 시작까지 남은 날을 말로 ('in 36 days', '36日後'). 화면 읽기 프로그램용
export function relativeDays(locale: string, days: number): string {
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(days, "day");
}

// 티켓·목록 줄 하나를 한 링크로 읽게: 'MAMA AWARDS, Awards, Osaka, Friday, November 20 – Saturday, November 21, in 36 days'
export function eventAriaLabel({
  e,
  view,
  locale,
  t,
}: {
  e: UpcomingEvent;
  view: DdayView;
  locale: Locale;
  t: Translate;
}): string {
  const city = e.city?.[locale];
  const range = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Seoul",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).formatRange(kst(e.start), kst(e.end ?? e.start));
  const when = view.state === "upcoming" ? relativeDays(locale, view.days) : t(view.state);
  return [e.name, t(`kind.${e.kind}`), city, range, when].filter(Boolean).join(", ");
}

// 티켓 상태 글자. 접수 기간이 끝난 선예매는 '선예매 끝'
export function ticketStatusLabel(ticket: TicketLink, t: Translate, now = new Date()): string {
  return t(`status.${ticketState(ticket, now)}`);
}

// 캘린더 파일 설명에 넣을 줄: 'Mnet Plus · Live', 'Qoo10 · Presale'
export function calendarLines(e: UpcomingEvent, t: Translate, now = new Date()): string[] {
  return [
    ...(e.watch ?? []).map((w) => `${w.name} · ${t(`mode.${w.mode}`)}`),
    ...(e.tickets ?? []).map((ticket) => `${ticket.name} · ${ticketStatusLabel(ticket, t, now)}`),
  ];
}
