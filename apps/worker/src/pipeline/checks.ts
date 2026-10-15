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
  if (locale !== "ko" && HANGUL.test(text)) return false;
  const letters = text.match(/\p{L}/gu) ?? [];
  if (letters.length === 0) return false;
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
