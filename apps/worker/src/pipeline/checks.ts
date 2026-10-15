import type { Locale } from "@kmedia/core";

interface CheckableDraft {
  facts: { statement: string }[];
  summary: string;
  body: string;
  faq: { q: string; a: string }[];
}

// 본문에 나온 숫자가 facts 에 없으면 경고로 남긴다 (사람 승인 때 확인). 숫자 3자리 콤마는 무시한다.
// allowed: 출처 밖이지만 써도 되는 숫자 (예: 오늘 날짜)
export function unsupportedNumbers(draft: CheckableDraft, allowed: string[] = []): string[] {
  const normalize = (s: string) => s.replace(/(\d),(?=\d{3})/g, "$1");
  const factText = normalize(draft.facts.map((f) => f.statement).join(" "));
  const written = normalize([draft.summary, draft.body, ...draft.faq.flatMap((f) => [f.q, f.a])].join(" "));
  const numbers = new Set(written.match(/\d+(?:\.\d+)?/g) ?? []);
  return [...numbers].filter((n) => n.length > 1 && !factText.includes(n) && !allowed.includes(n));
}

// 제목 최대 길이 (글자 수, 이모지·성조 결합 글자는 한 글자). 두 열 피드 카드에서 4줄 안에 들어가는 길이다.
// 언어마다 글자 폭이 달라 따로 잡는다: fr·ru 는 영어보다 20~30% 길고, 한중일은 한 글자가 넓다
export const HEADLINE_MAX: Record<Locale, number> = {
  en: 70,
  id: 70,
  fr: 64,
  vi: 60,
  ru: 56,
  ko: 34,
  ja: 32,
  "zh-TW": 32,
  "zh-CN": 32,
};

const graphemes = new Intl.Segmenter("und", { granularity: "grapheme" });

// 제목이 그 언어 상한을 넘는지. 넘어도 발행은 막지 않고 경고로 남긴다
export function headlineTooLong(locale: Locale, title: string): boolean {
  return [...graphemes.segment(title.trim())].length > HEADLINE_MAX[locale];
}

// ko 가 아닌 번역문에 남은 "(성심당)" 같은 한글 괄호 병기를 지운다. AI 를 다시 부르지 않는 무료 후처리
export function stripHangulParens(text: string): string {
  return text.replace(/\s?[（(][^()（）]*[가-힣][^()（）]*[)）]/g, "");
}

const HANGUL = /[가-힣]/;
const VI_TONES = /[ăâđêôơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/i;
const STOPWORDS: Record<string, string[]> = {
  fr: ["le", "la", "les", "des", "est", "et", "une", "pour", "du", "dans"],
  id: ["yang", "dan", "di", "dengan", "untuk", "ini", "dari", "pada"],
};

// 번역문이 정말 그 언어로 쓰였는지 글자·흔한 단어로 확인한다 (AI 없이).
// 예: 러시아어를 시켰는데 한국어로 돌아온 결과를 걸러 다시 보내게 한다
export function looksLikeLocale(locale: string, text: string): boolean {
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return false;
  // 고유명사 한두 개(예: "Seoul (서울)")는 봐준다. 한글이 2%를 넘으면 한국어로 답한 것이다
  if (locale !== "ko" && letters.filter((c) => HANGUL.test(c)).length / letters.length > 0.02) return false;
  switch (locale) {
    case "ru":
      return letters.filter((c) => /[Ѐ-ӿ]/.test(c)).length / letters.length > 0.5;
    case "vi":
      return VI_TONES.test(text);
    case "fr":
    case "id": {
      const words = new Set(STOPWORDS[locale]);
      return text.toLowerCase().split(/[^\p{L}]+/u).filter((w) => words.has(w)).length >= 3;
    }
    default:
      return true;
  }
}

// 한국어판이 원문 문장을 얼마나 그대로 가져왔는지 (AI 없이). 공백·문장부호를 빼고 8글자 조각으로 비교한다.
// 원문 표현을 옮기면 출처를 적어도 저작권 침해가 될 수 있다 (docs/PRD.md 10장)
export function overlapRatio(source: string, written: string, size = 8): number {
  const normalize = (s: string) => s.replace(/[^\p{L}\p{N}]/gu, "");
  const grams = (s: string) => {
    const out = new Set<string>();
    for (let i = 0; i + size <= s.length; i += 1) out.add(s.slice(i, i + size));
    return out;
  };
  const mine = grams(normalize(written));
  if (mine.size === 0) return 0;
  const theirs = grams(normalize(source));
  let shared = 0;
  for (const g of mine) if (theirs.has(g)) shared += 1;
  return shared / mine.size;
}
