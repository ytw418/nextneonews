import type { Locale } from "./locales";
import { SITE_NAME } from "./site";
import { eventState, kstToday, type UpcomingEvent } from "./upcoming";

// 일정 화면·캘린더 파일에 쓰는 날짜 도우미. React·Next 를 쓰지 않아 루트 vitest 로 바로 검사된다.
// 일정 날짜는 모두 KST 기준 'YYYY-MM-DD', 시각은 KST 'HH:mm' 이다.

// KST 날짜의 자정 (Asia/Seoul 로 포맷하면 그 날짜가 그대로 나온다)
export function kst(d: string): Date {
  return new Date(`${d}T00:00:00+09:00`);
}

// KST 날짜·시각의 한 순간
function kstInstant(date: string, hhmm: string): Date {
  return new Date(`${date}T${hhmm}:00+09:00`);
}

function addDays(d: string, n: number): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
}

export type RangeStyle = "short" | "long" | "full";

// 'Nov 20 – 21' (short) · 'Fri, Nov 20 – Sat, Nov 21' (long) · 끝에 연도까지 (full).
// 어느 모양이든 올해(KST)가 아니면 연도를 붙인다
export function formatRange(
  locale: string,
  start: string,
  end?: string,
  style: RangeStyle = "short",
  now = new Date(),
): string {
  const last = end ?? start;
  const year = kstToday(now).slice(0, 4);
  const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Seoul", month: "short", day: "numeric" };
  if (style !== "short") options.weekday = "short";
  if (style === "full" || start.slice(0, 4) !== year || last.slice(0, 4) !== year) options.year = "numeric";
  // ICU 의 일본어·중국어 기간 형식은 '11/20(金)～11/21(土)' 처럼 숫자만 나온다. 긴 모양은 '11月20日(金)～21日(土)' 로 직접 잇는다
  // (짧은 모양은 좁은 티켓에 들어가야 해서 숫자 그대로 둔다)
  const cjk = locale.startsWith("ja") ? "～" : locale.startsWith("zh") ? "至" : null;
  if (cjk && style !== "short" && last !== start) {
    const tail = { ...options };
    if (start.slice(0, 4) === last.slice(0, 4)) delete tail.year;
    // 대만 번체는 '日 + 요일'에서 日 이 빠져서 일본어만 같은 달의 달을 생략한다
    if (cjk === "～" && start.slice(0, 7) === last.slice(0, 7)) delete tail.month;
    const head = new Intl.DateTimeFormat(locale, options).format(kst(start));
    return `${head}${cjk}${new Intl.DateTimeFormat(locale, tail).format(kst(last))}`;
  }
  return new Intl.DateTimeFormat(locale, options).formatRange(kst(start), kst(last));
}

// 그 순간을 tz 의 시각으로 ('5:00 PM', '17:00'). 서버의 공연장 시각 줄과 브라우저의 '내 시간' 줄이 함께 쓴다
export function timeIn(locale: string, date: string, hhmm: string, tz: string): string {
  return new Intl.DateTimeFormat(locale, { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(
    kstInstant(date, hhmm),
  );
}

// '6:00 PM KST'
export function formatKstTime(locale: string, date: string, hhmm: string): string {
  return `${timeIn(locale, date, hhmm, "Asia/Seoul")} KST`;
}

export interface MonthGroup<T> {
  key: string; // 'YYYY-MM'
  label: string; // 'October', 올해가 아니면 'January 2027'
  events: T[];
}

// 시작일(KST)의 달로 묶는다. 진행 중인 일정도 시작한 달에 남는다. events 는 이미 날짜순이라고 본다
export function monthGroups<T extends Pick<UpcomingEvent, "start">>(
  events: T[],
  locale: string,
  now = new Date(),
): MonthGroup<T>[] {
  const year = kstToday(now).slice(0, 4);
  const groups: MonthGroup<T>[] = [];
  for (const e of events) {
    const key = e.start.slice(0, 7);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const options: Intl.DateTimeFormatOptions = { timeZone: "Asia/Seoul", month: "long" };
      if (!key.startsWith(year)) options.year = "numeric";
      group = { key, label: new Intl.DateTimeFormat(locale, options).format(kst(`${key}-01`)), events: [] };
      groups.push(group);
    }
    group.events.push(e);
  }
  return groups;
}

// ── 캘린더 (.ics, RFC 5545) ──

const ymd = (d: string) => d.replaceAll("-", "");
// 20261205T090000Z
const utcStamp = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

// 글자 안의 \ ; , 줄바꿈을 이스케이프한다
function icsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

const encoder = new TextEncoder();

// 한 줄이 75바이트를 넘으면 접는다. 이어지는 줄은 공백 한 칸으로 시작한다 (한글·일본어가 반쯤 잘리지 않게 글자 단위로)
function fold(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
      limit = 74;
    }
    current += ch;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

function location(e: UpcomingEvent, locale: Locale): string {
  return [e.venue, e.city?.[locale]].filter(Boolean).join(", ");
}

export interface IcsOptions {
  url: string; // 일정 상세 페이지 주소
  host: string; // UID 뒤에 붙는 사이트 도메인
  lines: string[]; // 설명에 넣을 언어별 줄 (보는 곳·티켓)
  dtstamp: Date; // 파일을 만든 때. 넘겨받아서 테스트에서 결과가 매번 같다
}

// 하루 종일 일정은 DATE 로 (끝 날짜는 다음 날, 미포함). 시작 시각이 있으면 UTC 로 바꾸고,
// 끝나는 시각은 모르니 DTEND 를 넣지 않는다. 여러 날이면 매일 같은 시각으로 반복한다
export function buildIcs(e: UpcomingEvent, locale: Locale, { url, host, lines, dtstamp }: IcsOptions): string {
  const { totalDays } = eventState(e);
  const timed = e.startTimeKst !== undefined;
  const where = location(e, locale);
  const out = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Schedule//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@${host}`,
    `DTSTAMP:${utcStamp(dtstamp)}`,
    ...(e.startTimeKst
      ? [
          `DTSTART:${utcStamp(kstInstant(e.start, e.startTimeKst))}`,
          ...(totalDays > 1 ? [`RRULE:FREQ=DAILY;COUNT=${totalDays}`] : []),
        ]
      : [`DTSTART;VALUE=DATE:${ymd(e.start)}`, `DTEND;VALUE=DATE:${ymd(addDays(e.end ?? e.start, 1))}`]),
    `SUMMARY:${icsText(e.name)}`,
    ...(where ? [`LOCATION:${icsText(where)}`] : []),
    `URL:${url}`,
    `DESCRIPTION:${icsText([...lines, url].join("\n"))}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    // 하루 종일: 전날 오전 9시 / 시각이 있으면 1시간 전
    `TRIGGER:${timed ? "-PT1H" : "-PT15H"}`,
    `DESCRIPTION:${icsText(e.name)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${out.map(fold).join("\r\n")}\r\n`;
}

// 애플 기기가 아닌 브라우저용: 구글 캘린더 '일정 추가' 화면
export function googleCalendarUrl(e: UpcomingEvent, locale: Locale, url: string): string {
  const { totalDays } = eventState(e);
  const dates = e.startTimeKst
    ? `${utcStamp(kstInstant(e.start, e.startTimeKst))}/${utcStamp(kstInstant(e.start, e.startTimeKst))}`
    : `${ymd(e.start)}/${ymd(addDays(e.end ?? e.start, 1))}`;
  const params = [
    "action=TEMPLATE",
    `text=${encodeURIComponent(e.name)}`,
    `dates=${dates}`,
    ...(e.startTimeKst && totalDays > 1 ? [`recur=${encodeURIComponent(`RRULE:FREQ=DAILY;COUNT=${totalDays}`)}`] : []),
    ...(location(e, locale) ? [`location=${encodeURIComponent(location(e, locale))}`] : []),
    `details=${encodeURIComponent(url)}`,
  ];
  return `https://calendar.google.com/calendar/render?${params.join("&")}`;
}
