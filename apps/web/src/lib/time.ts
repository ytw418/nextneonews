const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

// ICU 는 일본어·중국어에도 숫자 뒤에 빈칸을 둔다 ("8 分前"). 한중일 글자 앞 빈칸은 뺀다
function tight(text: string, locale: string): string {
  return /^(ja|zh)/.test(locale) ? text.replace(/(\d)\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu, "$1") : text;
}

// 이보다 오래된 글은 상대 시각 대신 날짜로
const RELATIVE_MAX_MS = 7 * 86_400_000;

// "Oct 19", "10月19日" (KST). 서버 HTML 에 넣는 발행 날짜 — 시간이 지나도 글자가 바뀌지 않는다
export function dateLabel(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "Asia/Seoul" }).format(date);
}

// "3時間前", "3小時前", "3 hours ago". 지금 시각에 따라 바뀌므로 브라우저에서만 부른다 (components/article/TimeAgo)
export function timeAgo(date: Date | null, locale: string, now = Date.now()): string {
  if (!date) return "";
  const diff = date.getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === "minute") {
      if (unit === "day" && Math.abs(diff) > RELATIVE_MAX_MS) return dateLabel(date, locale);
      return tight(rtf.format(Math.round(diff / ms), unit), locale);
    }
  }
  return "";
}

// 메모 커버의 날짜 도장 "10.15" (KST)
export function dateStamp(date: Date | null): string {
  if (!date) return "";
  const [, m, d] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(date).split("-");
  return `${m}.${d}`;
}
