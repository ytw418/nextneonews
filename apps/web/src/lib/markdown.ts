import { micromark } from "micromark";

// 이어 붙이는 다음 글(/api/article) 본문을 HTML 로. 글 페이지의 ReactMarkdown 과 같은 CommonMark 만 쓴다.
// 기본값(allowDangerousHtml·allowDangerousProtocol 끔)이라 본문 속 raw HTML·javascript: 링크는 글자로 이스케이프된다
export function markdownToHtml(markdown: string): string {
  return micromark(markdown);
}
