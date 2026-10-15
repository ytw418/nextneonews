import type { SignalMetrics } from "../collectors/types";

// 품질 체크 2단계를 AI 없이 한다 (비용 0원). 기준은 docs/production.md ①과 같다.
// 해외 인지도는 위키데이터 사전의 "그 인물이 실린 위키백과 언어 수"로 잰다.

export interface EntityHit {
  type: string; // group | singer | actor | series
  ko: string | null;
  en: string | null;
  sitelinks: number;
}

export interface HeuristicResult {
  foreignInterest: number;
  answerable: number;
  timeliness: number;
  evergreen: number;
  risk: "GREEN" | "YELLOW";
  category: "KPOP" | "KDRAMA" | "KFOOD" | "TRAVEL" | "WORKING_HOLIDAY" | "JOBS" | "HOUSING" | "LIFE";
  format: "ISSUE" | "REACTION" | "QNA" | "GUIDE" | "LIST";
  keyword: string;
  reason: string;
}

// 해외 팬·외국인이 관심 가질 단어
const GLOBAL_WORDS = ["월드투어", "투어", "콘서트", "팬미팅", "컴백", "MAMA", "AAA", "MMA", "골든디스크", "빌보드", "넷플릭스", "디즈니", "해외", "일본", "대만", "도쿄", "오사카", "글로벌"];
// 외국인 생활 정보 (해외 인지도와 상관없이 높게)
const FOREIGNER_WORDS = ["외국인", "비자", "워홀", "워킹홀리데이", "최저임금", "관광객", "K-ETA", "입국", "면세", "환급"];
const OFFICIAL_WORDS = ["[공식]", "공식입장", "공식 입장", "소속사", "발표", "확정"];
const EVERGREEN_WORDS = ["방법", "하는 법", "정리", "총정리", "가이드", "꿀팁", "추천"];
const LIST_WORDS = ["TOP", "순위", "랭킹"];
const QUESTION_WORDS = ["?", "언제", "어떻게", "얼마", "어디서", "어디"];
const YELLOW_WORDS = ["열애", "결별", "이혼", "파경", "논란", "폭로", "학폭", "음주", "고소", "소송", "갑질", "사과", "해명", "루머", "의혹", "불화", "탈퇴"];

const CATEGORY_WORDS: [HeuristicResult["category"], string[]][] = [
  ["WORKING_HOLIDAY", ["워홀", "워킹홀리데이", "비자"]],
  ["JOBS", ["알바", "최저임금", "주휴수당", "취업"]],
  ["HOUSING", ["월세", "전세", "보증금", "고시원", "부동산"]],
  ["KFOOD", ["편의점", "맛집", "라면", "빵", "디저트", "레시피", "먹방"]],
  ["TRAVEL", ["여행", "축제", "단풍", "관광", "호텔"]],
];

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));
const clamp = (n: number) => Math.min(5, Math.max(1, n));

function interestFromSitelinks(sitelinks: number): number {
  if (sitelinks >= 40) return 5;
  if (sitelinks >= 20) return 4;
  if (sitelinks >= 10) return 3;
  if (sitelinks >= 5) return 2;
  return 1;
}

export function evaluate(input: { title: string; source: string }, entities: EntityHit[]): HeuristicResult {
  const { title, source } = input;
  const top = entities[0];
  const reasons: string[] = [];

  let foreignInterest = interestFromSitelinks(top?.sitelinks ?? 0);
  if (top) reasons.push(`${top.en ?? top.ko}(위키 ${top.sitelinks}개 언어)`);
  if (has(title, GLOBAL_WORDS)) {
    foreignInterest = clamp(foreignInterest + 1);
    reasons.push("해외 관심 단어");
  }
  if (has(title, FOREIGNER_WORDS)) {
    foreignInterest = Math.max(foreignInterest, 4);
    reasons.push("외국인 생활 정보");
  }

  const community = source === "pann";
  let answerable = community ? 2 : 4;
  if (has(title, OFFICIAL_WORDS)) answerable = 5;

  const evergreen = has(title, EVERGREEN_WORDS) ? 4 : 1;
  const timeliness = 4; // 랭킹에 지금 올라온 글

  const matchedCategory = CATEGORY_WORDS.find(([, words]) => has(title, words))?.[0];
  const category: HeuristicResult["category"] =
    matchedCategory ??
    (top?.type === "group" || top?.type === "singer" ? "KPOP" : top ? "KDRAMA" : "LIFE");

  const format: HeuristicResult["format"] = community
    ? "REACTION"
    : has(title, QUESTION_WORDS)
      ? "QNA"
      : has(title, LIST_WORDS)
        ? "LIST"
        : evergreen > 1
          ? "GUIDE"
          : "ISSUE";

  // 같은 사람의 소식은 한 주제로 묶는다: 주요 인물 이름이 곧 주제 키
  const keyword = entities
    .slice(0, 2)
    .map((e) => e.ko ?? e.en)
    .filter(Boolean)
    .join(" ") || title.replace(/\[[^\]]*\]/g, "").trim().slice(0, 30);

  return {
    foreignInterest,
    answerable,
    timeliness,
    evergreen,
    risk: has(title, YELLOW_WORDS) ? "YELLOW" : "GREEN",
    category,
    format,
    keyword,
    reason: reasons.join(", ") || "사전에 없는 인물",
  };
}

// docs/production.md ①: 해외관심×2 + 답변가능×2 + max(시의성, 에버그린) + 반응 보정
export function totalScore(r: HeuristicResult, metrics: SignalMetrics): number {
  const rank = metrics.rank ?? Infinity;
  const bonus = rank <= 5 ? 2 : rank <= 15 ? 1 : 0;
  return r.foreignInterest * 2 + r.answerable * 2 + Math.max(r.timeliness, r.evergreen) + bonus;
}
