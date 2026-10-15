const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

// ICU 는 일본어·중국어에도 숫자 뒤에 빈칸을 둔다 ("8 分前"). 한중일 글자 앞 빈칸은 뺀다
function tight(text: string, locale: string): string {
  return /^(ja|zh)/.test(locale) ? text.replace(/(\d)\s+(?=[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}])/gu, "$1") : text;
}

// "3時間前", "3小時前", "3 hours ago"
export function timeAgo(date: Date | null, locale: string, now = Date.now()): string {
  if (!date) return "";
  const diff = date.getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, ms] of UNITS) {
    if (Math.abs(diff) >= ms || unit === "minute") {
      if (unit === "day" && Math.abs(diff) > 7 * 86_400_000) {
        return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "Asia/Seoul" }).format(date);
      }
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
