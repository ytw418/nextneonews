// news-sitemap.xml·feed.xml 공용: XML 글자 이스케이프. 제목에 & · < · 따옴표가 흔하다 (위키미디어 주소의 & 포함).
// XML 1.0 에 쓸 수 없는 제어 문자는 지운다 (하나만 섞여도 피드 전체가 깨진다)
export function xmlEscape(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
