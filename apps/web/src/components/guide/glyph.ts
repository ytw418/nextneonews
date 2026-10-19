import type { CatalogSummary } from "@/data/types";

// 요약 한 줄(CatalogSummary)만 있는 자리(저장함·지금 인기·교차 레일)의 커버 유령 글자.
// 상세 화면은 데이터가 있어 DESIGN.md §4-① 규칙(회복 일수·회차)대로 직접 고르고, 여기서는 제목·부제로 어림한다:
// 뷰티 = 브랜드 라틴 이니셜, 드라마 = 방영 연도 '24, 그 밖 = 이름 첫 글자 (한중일은 1자, 라틴은 단어 이니셜 2자까지)

const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const YEAR = /\b(?:19|20)(\d{2})\b/;
// 이니셜에서 빼는 짧은 말 (Beauty of Joseon → BJ)
const MINOR = new Set(["of", "the", "and", "de", "la", "le", "&"]);

function initials(text: string): string {
  const first = Array.from(text.trim())[0] ?? "";
  if (CJK.test(first)) return first;
  const words = text
    .split(/[\s·\-–/]+/)
    .filter((w) => w && !MINOR.has(w.toLowerCase()) && /^[A-Za-z0-9]/.test(w));
  if (words.length === 0) return first.toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function coverGlyph(summary: Pick<CatalogSummary, "kind" | "title" | "sub">): string {
  const { kind, title, sub } = summary;
  if (kind === "beauty" && sub) return initials(sub);
  if (kind === "drama") {
    const year = sub?.match(YEAR)?.[1];
    if (year) return `’${year}`;
  }
  return initials(title);
}
