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
