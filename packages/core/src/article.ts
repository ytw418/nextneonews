// 글 페이지에 쓰는 순수 도우미 (React·Next 없이 루트 vitest 로 검사한다)

// 한중일 글자는 낱자로 센다 (한글 포함, 띄어쓰기와 상관없이)
const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const WORD = /[\p{L}\p{N}][\p{L}\p{N}\p{M}'’-]*/gu;

// 읽는 데 걸리는 분: 라틴·키릴 단어는 분당 220개, 한중일 글자는 분당 500자. 최소 1분.
// 마크다운 링크 주소는 읽는 글이 아니라서 뺀다
export function readMinutes(markdown: string): number {
  const text = markdown.replace(/\]\([^)]*\)/g, "]");
  const cjk = text.match(CJK)?.length ?? 0;
  const words = text.replace(CJK, " ").match(WORD)?.length ?? 0;
  return Math.max(1, Math.round(words / 220 + cjk / 500));
}

// 소문자로, 문장부호·기호·공백을 빼고 비교한다 ('Where can I watch it?' = '## Where can I watch it')
function normalize(s: string): string {
  return s.toLowerCase().replace(/[\p{P}\p{S}\s]/gu, "");
}

// 본문 소제목(## )과 같은 질문은 FAQ 에서 뺀다 — 같은 말을 두 번 읽히지 않게
export function faqNotInBody<T extends { q: string }>(faq: T[], markdown: string): T[] {
  const headings = new Set(
    markdown
      .split("\n")
      .map((line) => line.trimStart())
      .filter((line) => line.startsWith("## "))
      .map((line) => normalize(line.slice(3))),
  );
  return faq.filter((item) => !headings.has(normalize(item.q)));
}
