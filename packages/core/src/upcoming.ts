import type { Locale } from "./locales";

// 홈 "D-day" 레일과 일정 상세 페이지에 보여 줄 확정 일정. 출처에서 확인한 사실만 넣는다 (docs/keywords.md 1장).
// 모르는 값은 비워 둔다. 지나간 일정은 화면에서 자동으로 빠진다.
export type EventKind = "comeback" | "awards" | "festival" | "concert";

export interface EventLink {
  name: string; // 고유명사 (예: "Mnet Plus", "Qoo10")
  url?: string;
  note?: string; // 짧은 영어 메모. 화면에는 그대로 보인다 (예: "Visa presale, registration Oct 13–18")
}

export interface EventDay {
  date: string; // KST YYYY-MM-DD
  acts: string[];
  hosts?: string[];
}

export interface UpcomingEvent {
  id: string;
  name: string; // 고유명사라 언어별로 바꾸지 않는다
  kind: EventKind;
  start: string; // KST 날짜 YYYY-MM-DD
  end?: string;
  startTimeKst?: string; // "18:00"
  place: Record<Locale, string>; // 도시 (컴백은 "동시 컴백" 같은 설명)
  venue?: string; // 공연장 공식 영문 이름
  releases?: { act: string; title: string; note?: string }[]; // 컴백 일정
  days?: EventDay[]; // 날짜별 출연진 (발표된 것만, 일부)
  lineup?: string[]; // 날짜가 정해지지 않은 출연진
  watch?: EventLink[];
  tickets?: EventLink[];
  officialUrl?: string;
  keywords: string[]; // 관련 기사 찾기 (제목·키워드에 들어 있으면)
  sources: string[];
}

export const UPCOMING: UpcomingEvent[] = [
  {
    id: "comeback-1026",
    name: "IVE · ILLIT · RIIZE",
    kind: "comeback",
    start: "2026-10-26",
    place: {
      en: "Comeback day",
      ja: "同日カムバ",
      "zh-TW": "同日回歸",
      "zh-CN": "同日回归",
      ko: "동시 컴백",
      vi: "Ngày comeback",
      id: "Hari comeback",
      fr: "Jour de comeback",
      ru: "День камбэка",
    },
    releases: [
      { act: "IVE", title: "Looks Can Kill", note: "EP · pre-release Oct 19" },
      { act: "ILLIT", title: "BREAK EVEN", note: "5th mini album · 6 PM" },
      { act: "RIIZE", title: "Prologue single", note: "2nd album “EMOTIION” in spring 2027" },
    ],
    keywords: ["IVE", "아이브", "ILLIT", "아일릿", "RIIZE", "라이즈"],
    sources: [
      "https://www.koreatimes.co.kr/entertainment/k-pop/20261006/ive-illit-riize-collide-as-october-k-pop-comeback-race-heats-up",
      "https://www.soompi.com/article/1873360wpp/ive-announces-comeback-date-for-new-ep-looks-can-kill",
    ],
  },
  {
    id: "mma-2026",
    name: "MMA 2026",
    kind: "awards",
    start: "2026-11-14",
    end: "2026-11-15",
    place: { en: "Seoul", ja: "ソウル", "zh-TW": "首爾", "zh-CN": "首尔", ko: "서울", vi: "Seoul", id: "Seoul", fr: "Séoul", ru: "Сеул" },
    venue: "Gocheok Sky Dome",
    // 날짜별 출연은 아직 발표되지 않았다
    lineup: [
      "PLAVE", "RIIZE", "NCT WISH", "ALPHA DRIVE ONE", "LNGSHOT", "YENA", "ILLIT", "RESCENE",
      "Hearts2Hearts", "NCT 127", "NCT DREAM", "ATEEZ", "TWS", "AND2BLE", "82MAJOR",
    ],
    watch: [{ name: "Wavve", note: "Live from the red carpet · VOD after" }],
    keywords: ["MMA", "Melon Music Awards", "멜론뮤직어워드"],
    sources: [
      "https://www.soompi.com/article/1846316wpp/melon-music-awards-2026-announces-dates-and-details",
      "https://www.koreajoongangdaily.com/entertainment/melon-music-awards-to-return-with-first-2-day-ceremony-in-november/12698044",
    ],
  },
  {
    id: "mama-2026",
    name: "MAMA AWARDS",
    kind: "awards",
    start: "2026-11-20",
    end: "2026-11-21",
    place: { en: "Osaka", ja: "大阪", "zh-TW": "大阪", "zh-CN": "大阪", ko: "오사카", vi: "Osaka", id: "Osaka", fr: "Osaka", ru: "Осака" },
    venue: "Kyocera Dome Osaka",
    days: [
      { date: "2026-11-20", acts: ["ALPHA DRIVE ONE", "BABYMONSTER", "ENHYPEN", "ILLIT", "INI", "NCT WISH", "RESCENE"] },
      { date: "2026-11-21", acts: ["CORTIS", "KiiiKiii", "LE SSERAFIM", "NAYEON", "ZEROBASEONE"] },
    ],
    watch: [{ name: "Mnet Plus", note: "Live worldwide" }],
    tickets: [
      {
        name: "Qoo10",
        url: "https://www.qoo10.jp/gmkt.inc/Special/Special.aspx?sid=367181",
        note: "Visa presale · registration Oct 13–18",
      },
    ],
    keywords: ["MAMA", "마마 어워즈", "MAMA AWARDS"],
    sources: [
      "https://newsroom.cj.net/2026-mama-awards-to-take-place-in-japan-from-november-20-21/",
      "https://sports.khan.co.kr/en/article/202610130901007",
    ],
  },
  {
    id: "blue-dragon-2026",
    name: "Blue Dragon Film Awards",
    kind: "awards",
    start: "2026-11-25",
    place: { en: "Seoul", ja: "ソウル", "zh-TW": "首爾", "zh-CN": "首尔", ko: "서울", vi: "Seoul", id: "Seoul", fr: "Séoul", ru: "Сеул" },
    venue: "KBS Hall, Yeouido",
    keywords: ["Blue Dragon", "청룡영화상"],
    sources: [
      "https://www.soompi.com/article/1877253wpp/blue-dragon-film-awards-announces-date-for-2026-ceremony",
      "https://www.joynews24.com/view/2013772",
    ],
  },
  {
    id: "aaa-2026",
    name: "AAA 2026",
    kind: "awards",
    start: "2026-12-05",
    end: "2026-12-06",
    startTimeKst: "18:00",
    place: {
      en: "Kaohsiung",
      ja: "高雄",
      "zh-TW": "高雄",
      "zh-CN": "高雄",
      ko: "가오슝",
      vi: "Cao Hùng",
      id: "Kaohsiung",
      fr: "Kaohsiung",
      ru: "Гаосюн",
    },
    venue: "Kaohsiung National Stadium",
    days: [
      {
        date: "2026-12-05",
        hosts: ["Tzuyu", "Seong Han-bin"],
        acts: [
          "RIIZE", "ATEEZ", "ITZY", "MONSTA X", "NEXZ", "&TEAM", "KISS OF LIFE", "tripleS", "Hearts2Hearts",
          "WOODZ", "Yeonjun", "Wonpil", "Choi Ye-na",
        ],
      },
      {
        date: "2026-12-06",
        hosts: ["Jang Won-young", "Ji Chang-wook"],
        acts: ["TXT", "ZEROBASEONE", "NMIXX", "CORTIS", "TWS", "KiiiKiii", "QWER", "MEOVV", "CLOSE YOUR EYES", "tripleS"],
      },
    ],
    tickets: [{ name: "tixCraft", note: "Sold out" }],
    officialUrl: "https://www.asiaartistawards.com",
    keywords: ["AAA", "Asia Artist Awards", "아시아 아티스트 어워즈"],
    sources: ["https://sports.khan.co.kr/en/article/202609160040007", "https://www.asiaartistawards.com"],
  },
  {
    id: "gda-2027",
    name: "Golden Disc Awards",
    kind: "awards",
    start: "2027-01-09",
    end: "2027-01-10",
    place: { en: "Hanoi", ja: "ハノイ", "zh-TW": "河內", "zh-CN": "河内", ko: "하노이", vi: "Hà Nội", id: "Hanoi", fr: "Hanoï", ru: "Ханой" },
    venue: "Vietnam Exhibition Center (VEC)",
    tickets: [{ name: "Trip.com × MAISEAT", note: "Sale dates not announced" }],
    officialUrl: "https://x.com/_GoldenDisc",
    keywords: ["Golden Disc", "골든디스크"],
    sources: [
      "https://www.koreajoongangdaily.com/entertainment/41st-golden-disc-awards-to-be-held-for-2-days-in-hanoi-in-january/12859862",
      "https://www.soompi.com/article/1854772wpp/41st-golden-disc-awards-unveils-location-and-details",
    ],
  },
];

export function findEvent(id: string): UpcomingEvent | undefined {
  return UPCOMING.find((e) => e.id === id);
}

// KST 기준 오늘부터 남은 날 수 (오늘이면 0)
export function daysUntil(dateKst: string, now = new Date()): number {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
  const ms = Date.parse(`${dateKst}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
