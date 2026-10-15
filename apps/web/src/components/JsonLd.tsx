// Next.js 권장 방식: script 태그로 넣고 "<" 를 이스케이프해 XSS 를 막는다
export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
