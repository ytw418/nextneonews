const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

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
      return rtf.format(Math.round(diff / ms), unit);
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
