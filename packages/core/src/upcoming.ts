import type { Locale } from "./locales";

// 홈 "D-day" 레일에 보여 줄 확정 일정. 출처가 있는 것만 넣는다 (docs/keywords.md 1장).
// 지나간 일정은 화면에서 자동으로 빠진다.
export interface UpcomingEvent {
  id: string;
  name: string; // 고유명사라 언어별로 바꾸지 않는다
  start: string; // KST 날짜 YYYY-MM-DD
  end?: string;
  place: Record<Locale, string>;
  source: string;
}

export const UPCOMING: UpcomingEvent[] = [
  {
    id: "comeback-1026",
    name: "IVE · ILLIT · RIIZE",
    start: "2026-10-26",
    place: { en: "Comeback day", ja: "同日カムバ", "zh-TW": "同日回歸", ko: "동시 컴백" },
    source: "https://www.koreatimes.co.kr/entertainment/k-pop/20261006/ive-illit-riize-collide-as-october-k-pop-comeback-race-heats-up",
  },
  {
    id: "mma-2026",
    name: "MMA 2026",
    start: "2026-11-14",
    end: "2026-11-15",
    place: { en: "Seoul", ja: "ソウル", "zh-TW": "首爾", ko: "서울" },
    source: "https://www.soompi.com/article/1846316wpp/melon-music-awards-2026-announces-dates-and-details",
  },
  {
    id: "mama-2026",
    name: "MAMA AWARDS",
    start: "2026-11-20",
    end: "2026-11-21",
    place: { en: "Osaka", ja: "大阪", "zh-TW": "大阪", ko: "오사카" },
    source: "https://newsroom.cj.net/2026-mama-awards-to-take-place-in-japan-from-november-20-21/",
  },
  {
    id: "blue-dragon-2026",
    name: "Blue Dragon Film Awards",
    start: "2026-11-25",
    place: { en: "Seoul", ja: "ソウル", "zh-TW": "首爾", ko: "서울" },
    source: "https://www.soompi.com/article/1877253wpp/blue-dragon-film-awards-announces-date-for-2026-ceremony",
  },
  {
    id: "aaa-2026",
    name: "AAA 2026",
    start: "2026-12-05",
    end: "2026-12-06",
    place: { en: "Kaohsiung", ja: "高雄", "zh-TW": "高雄", ko: "가오슝" },
    source: "https://sports.khan.co.kr/en/article/202609160040007",
  },
  {
    id: "gda-2027",
    name: "Golden Disc Awards",
    start: "2027-01-09",
    end: "2027-01-10",
    place: { en: "Hanoi", ja: "ハノイ", "zh-TW": "河內", ko: "하노이" },
    source: "https://www.koreajoongangdaily.com/entertainment/41st-golden-disc-awards-to-take-place-in-hanoi-in-january/12774573",
  },
];

// KST 기준 오늘부터 남은 날 수 (오늘이면 0)
export function daysUntil(dateKst: string, now = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
  const ms = Date.parse(`${dateKst}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
