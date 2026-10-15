import type { Locale } from "./locales";

// 홈 일정 레일·일정 목록·일정 상세에 보여 줄 확정 일정. 출처에서 확인한 사실만 넣는다 (docs/keywords.md 1장).
// 모르는 값은 비워 둔다 (undefined → 화면에서 그 줄이 빠진다). 지나간 일정은 '지난 일정'으로 내려간다.
export type EventKind = "comeback" | "awards" | "concert" | "festival" | "fanmeeting" | "drama";
export type TicketStatus = "notYet" | "presale" | "onSale" | "soldOut";

export interface WatchLink {
  name: string; // 고유명사 (예: "Mnet Plus")
  url?: string;
  mode: "live" | "vod" | "liveAndVod";
  note?: string; // 짧은 영어 메모. 영어 화면에서만 보조 줄로 보인다
}

export interface TicketLink {
  name: string; // 고유명사 (예: "Qoo10")
  url?: string;
  status: TicketStatus;
  window?: { from: string; to: string }; // 접수 기간 (KST YYYY-MM-DD)
  note?: string; // 짧은 영어 메모. 영어 화면에서만 보인다
}

export interface Release {
  act: string;
  title: string;
  kind?: "single" | "ep" | "album";
  date?: string; // KST YYYY-MM-DD
  timeKst?: string; // "18:00"
  note?: string; // 짧은 영어 메모. 영어 화면에서만 보인다
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
  tz?: string; // 공연장 시간대 (IANA). 없으면 Asia/Seoul
  city?: Record<Locale, string>; // 도시. 컴백·드라마 첫 방송처럼 장소가 없는 일정은 비운다
  venue?: string; // 공연장 공식 영문 이름
  about?: Partial<Record<Locale, string>>; // 출처로 쓴 한 문장(90자 이내). 없는 언어는 그 줄을 숨긴다
  releases?: Release[]; // 컴백 일정
  days?: EventDay[]; // 날짜별 출연진 (발표된 것만, 일부)
  lineup?: string[]; // 날짜가 정해지지 않은 출연진
  lineupPartial?: boolean; // 기본 true → '출연진은 더 늘어날 수 있어요'
  watch?: WatchLink[];
  tickets?: TicketLink[];
  officialUrl?: string;
  keywords: string[]; // 관련 기사 찾기 (eventMatches)
  sources: string[];
  checkedAt: string; // 사실을 마지막으로 출처와 대조한 날 (KST YYYY-MM-DD)
}

const SEOUL: Record<Locale, string> = {
  en: "Seoul",
  ja: "ソウル",
  "zh-TW": "首爾",
  "zh-CN": "首尔",
  ko: "서울",
  vi: "Seoul",
  id: "Seoul",
  fr: "Séoul",
  ru: "Сеул",
};

export const UPCOMING: UpcomingEvent[] = [
  {
    id: "comeback-1026",
    name: "IVE · ILLIT · RIIZE",
    kind: "comeback",
    start: "2026-10-26",
    about: {
      en: "IVE, ILLIT and RIIZE all release new music on the same day.",
      ja: "IVE・ILLIT・RIIZEが同じ日に新曲を出します。",
      ko: "IVE·ILLIT·RIIZE가 같은 날 신곡을 내요.",
      "zh-TW": "IVE、ILLIT、RIIZE 同一天推出新作。",
    },
    releases: [
      { act: "IVE", title: "Looks Can Kill", kind: "ep", date: "2026-10-26", note: "Pre-release Oct 19" },
      { act: "ILLIT", title: "BREAK EVEN", kind: "ep", date: "2026-10-26", timeKst: "18:00", note: "5th mini album" },
      {
        act: "RIIZE",
        title: "Prologue single",
        kind: "single",
        date: "2026-10-26",
        note: "2nd album “EMOTIION” in spring 2027",
      },
    ],
    keywords: ["IVE", "아이브", "ILLIT", "아일릿", "RIIZE", "라이즈"],
    sources: [
      "https://www.koreatimes.co.kr/entertainment/k-pop/20261006/ive-illit-riize-collide-as-october-k-pop-comeback-race-heats-up",
      "https://www.soompi.com/article/1873360wpp/ive-announces-comeback-date-for-new-ep-looks-can-kill",
    ],
    checkedAt: "2026-10-16",
  },
  {
    id: "mma-2026",
    name: "MMA 2026",
    kind: "awards",
    start: "2026-11-14",
    end: "2026-11-15",
    city: SEOUL,
    venue: "Gocheok Sky Dome",
    about: {
      en: "The Melon Music Awards run over two days for the first time.",
      ja: "メロン・ミュージック・アワードが初めて2日間開かれます。",
      ko: "멜론뮤직어워드가 처음으로 이틀 동안 열려요.",
      "zh-TW": "Melon Music Awards 首次連辦兩天。",
    },
    // 날짜별 출연은 아직 발표되지 않았다
    lineup: [
      "PLAVE", "RIIZE", "NCT WISH", "ALPHA DRIVE ONE", "LNGSHOT", "YENA", "ILLIT", "RESCENE",
      "Hearts2Hearts", "NCT 127", "NCT DREAM", "ATEEZ", "TWS", "AND2BLE", "82MAJOR",
    ],
    watch: [{ name: "Wavve", mode: "liveAndVod", note: "From the red carpet" }],
    keywords: ["MMA", "Melon Music Awards", "멜론뮤직어워드"],
    sources: [
      "https://www.soompi.com/article/1846316wpp/melon-music-awards-2026-announces-dates-and-details",
      "https://www.koreajoongangdaily.com/entertainment/melon-music-awards-to-return-with-first-2-day-ceremony-in-november/12698044",
    ],
    checkedAt: "2026-10-16",
  },
  {
    id: "mama-2026",
    name: "MAMA AWARDS",
    kind: "awards",
    start: "2026-11-20",
    end: "2026-11-21",
    tz: "Asia/Tokyo",
    city: { en: "Osaka", ja: "大阪", "zh-TW": "大阪", "zh-CN": "大阪", ko: "오사카", vi: "Osaka", id: "Osaka", fr: "Osaka", ru: "Осака" },
    venue: "Kyocera Dome Osaka",
    about: {
      en: "Two days of K-pop stages and awards, streamed live worldwide.",
      ja: "K-POPのステージと授賞が2日間、世界に生配信されます。",
      ko: "K-팝 무대와 시상이 이틀 동안 이어지고, 전 세계에 생중계돼요.",
      "zh-TW": "兩天的 K-POP 舞台與頒獎，全球同步直播。",
    },
    days: [
      { date: "2026-11-20", acts: ["ALPHA DRIVE ONE", "BABYMONSTER", "ENHYPEN", "ILLIT", "INI", "NCT WISH", "RESCENE"] },
      { date: "2026-11-21", acts: ["CORTIS", "KiiiKiii", "LE SSERAFIM", "NAYEON", "ZEROBASEONE"] },
    ],
    watch: [{ name: "Mnet Plus", mode: "live", note: "Worldwide" }],
    tickets: [
      {
        name: "Qoo10",
        url: "https://www.qoo10.jp/gmkt.inc/Special/Special.aspx?sid=367181",
        status: "presale",
        window: { from: "2026-10-13", to: "2026-10-18" },
        note: "Visa cardholders",
      },
    ],
    keywords: ["MAMA", "마마 어워즈", "MAMA AWARDS"],
    sources: [
      "https://newsroom.cj.net/2026-mama-awards-to-take-place-in-japan-from-november-20-21/",
      "https://sports.khan.co.kr/en/article/202610130901007",
    ],
    checkedAt: "2026-10-16",
  },
  {
    id: "blue-dragon-2026",
    name: "Blue Dragon Film Awards",
    kind: "awards",
    start: "2026-11-25",
    city: SEOUL,
    venue: "KBS Hall, Yeouido",
    about: {
      en: "The 47th edition of one of Korea's most prestigious film awards.",
      ja: "韓国で最も権威ある映画賞のひとつ、第47回の授賞式です。",
      ko: "한국에서 가장 권위 있는 영화상 중 하나, 제47회 시상식이에요.",
      "zh-TW": "韓國最具權威的電影獎之一，第 47 屆頒獎典禮。",
    },
    keywords: ["Blue Dragon", "청룡영화상"],
    sources: [
      "https://www.soompi.com/article/1877253wpp/blue-dragon-film-awards-announces-date-for-2026-ceremony",
      "https://www.joynews24.com/view/2013772",
    ],
    checkedAt: "2026-10-16",
  },
  {
    id: "aaa-2026",
    name: "AAA 2026",
    kind: "awards",
    start: "2026-12-05",
    end: "2026-12-06",
    startTimeKst: "18:00", // 현지 17:00 (대만), 레드카펫 15:00
    tz: "Asia/Taipei",
    city: {
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
    about: {
      en: "Awards for both singers and actors, with 100,000 seats sold out in 10 minutes.",
      ja: "歌手と俳優の両方を表彰する授賞式で、10万席が10分で完売しました。",
      ko: "가수와 배우를 함께 시상하고, 10만 석이 10분 만에 매진됐어요.",
      "zh-TW": "同時表揚歌手與演員，10 萬個座位 10 分鐘內售完。",
    },
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
    tickets: [{ name: "tixCraft", status: "soldOut" }],
    officialUrl: "https://www.asiaartistawards.com",
    keywords: ["AAA", "Asia Artist Awards", "아시아 아티스트 어워즈"],
    sources: [
      "https://sports.khan.co.kr/en/article/202609160040007",
      "https://www.asiaartistawards.com",
      "https://www.setn.com/ampnews/1907245",
    ],
    checkedAt: "2026-10-16",
  },
  {
    id: "gda-2027",
    name: "Golden Disc Awards",
    kind: "awards",
    start: "2027-01-09",
    end: "2027-01-10",
    tz: "Asia/Ho_Chi_Minh",
    city: { en: "Hanoi", ja: "ハノイ", "zh-TW": "河內", "zh-CN": "河内", ko: "하노이", vi: "Hà Nội", id: "Hanoi", fr: "Hanoï", ru: "Ханой" },
    venue: "Vietnam Exhibition Center (VEC)",
    about: {
      en: "Korea's longest-running pop music awards, held outdoors in Vietnam for the first time.",
      ja: "韓国で最も歴史のある音楽授賞式が、初めてベトナムの野外ステージで開かれます。",
      ko: "가장 오래된 한국 대중음악 시상식이 처음으로 베트남 야외 무대에서 열려요.",
      "zh-TW": "韓國歷史最悠久的流行音樂頒獎典禮，首次在越南戶外舞台舉行。",
    },
    tickets: [{ name: "Trip.com × MAISEAT", status: "notYet", note: "Sale dates not announced" }],
    officialUrl: "https://x.com/_GoldenDisc",
    keywords: ["Golden Disc", "골든디스크"],
    sources: [
      "https://www.koreajoongangdaily.com/entertainment/41st-golden-disc-awards-to-be-held-for-2-days-in-hanoi-in-january/12859862",
      "https://www.soompi.com/article/1854772wpp/41st-golden-disc-awards-unveils-location-and-details",
    ],
    checkedAt: "2026-10-16",
  },
];

export function findEvent(id: string): UpcomingEvent | undefined {
  return UPCOMING.find((e) => e.id === id);
}

// KST 기준 오늘 'YYYY-MM-DD'
export function kstToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);
}

// 두 KST 날짜 사이의 날 수 (b − a)
function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);
}

// KST 기준 오늘부터 남은 날 수 (오늘이면 0)
export function daysUntil(dateKst: string, now = new Date()): number {
  return dayDiff(kstToday(now), dateKst);
}

export type EventState = "upcoming" | "today" | "ongoing" | "ended";

export interface EventView {
  state: EventState;
  days: number; // 시작일까지 남은 날 (지났으면 음수)
  dayIndex: number; // 진행 중이면 몇째 날인지 (1부터). 시작 전·끝난 뒤는 0
  totalDays: number;
}

// 이틀짜리 일정의 둘째 날은 '오늘'이 아니라 '진행 중'이다
export function eventState(e: Pick<UpcomingEvent, "start" | "end">, now = new Date()): EventView {
  const days = daysUntil(e.start, now);
  const end = e.end ?? e.start;
  const totalDays = dayDiff(e.start, end) + 1;
  if (daysUntil(end, now) < 0) return { state: "ended", days, dayIndex: 0, totalDays };
  if (days === 0) return { state: "today", days, dayIndex: 1, totalDays };
  if (days < 0) return { state: "ongoing", days, dayIndex: 1 - days, totalDays };
  return { state: "upcoming", days, dayIndex: 0, totalDays };
}

export type EventWithView = UpcomingEvent & { view: EventView };

const withView = (now: Date) => (e: UpcomingEvent): EventWithView => ({ ...e, view: eventState(e, now) });

// 끝나지 않은 일정을 시작일 → 이름 순으로 (파일 순서와 상관없이)
export function listUpcoming(now = new Date()): EventWithView[] {
  return UPCOMING.map(withView(now))
    .filter((e) => e.view.state !== "ended")
    .sort((a, b) => a.start.localeCompare(b.start) || a.name.localeCompare(b.name));
}

// 끝난 일정, 최근 것부터
export function listPast(now = new Date()): EventWithView[] {
  return UPCOMING.map(withView(now))
    .filter((e) => e.view.state === "ended")
    .sort((a, b) => b.start.localeCompare(a.start) || a.name.localeCompare(b.name));
}

// 접수 기간이 지난 선예매는 'closed' 로 보여 준다
export function ticketState(t: TicketLink, now = new Date()): TicketStatus | "closed" {
  if (t.status === "presale" && t.window && kstToday(now) > t.window.to) return "closed";
  return t.status;
}

// '티켓 보러 가기' 버튼을 띄울 만한 티켓: 선예매·판매 중이고, 링크가 있고, 기간이 남았다
export function ticketOpen(t: TicketLink, now = new Date()): boolean {
  if (t.status !== "presale" && t.status !== "onSale") return false;
  if (!t.url) return false;
  return !t.window || kstToday(now) <= t.window.to;
}

// 'MMA' 같은 짧은 대문자 키워드는 대소문자를 지키고 단어 경계로만 (Emma 에 걸리지 않게).
// 그 밖의 키워드(한글·긴 이름)는 대소문자 무시 포함 검사
export function eventMatches(e: Pick<UpcomingEvent, "keywords">, text: string): boolean {
  const lower = text.toLowerCase();
  return e.keywords.some((k) => {
    if (/^[A-Z0-9]{2,4}$/.test(k)) return new RegExp(`(^|[^A-Za-z0-9])${k}([^A-Za-z0-9]|$)`).test(text);
    return lower.includes(k.toLowerCase());
  });
}

// 기사에 붙일 일정 카드: 다가오는 일정 중 제목·인물 이름에 키워드가 있고, 시작 120일 전 이후에 나온 기사만
// (작년 MAMA 기사에 올해 MAMA 가 붙지 않게)
export function findEventForArticle(
  a: { title: string; entityNames: string[]; publishedAt: Date | null },
  now = new Date(),
): EventWithView | undefined {
  if (!a.publishedAt) return undefined;
  const published = kstToday(a.publishedAt);
  const text = `${a.title} ${a.entityNames.join(" ")}`;
  return listUpcoming(now).find((e) => dayDiff(e.start, published) >= -120 && eventMatches(e, text));
}
