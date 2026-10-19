import Script from "next/script";

// GA4 측정 id. Vercel 운영 배포에서 NEXT_PUBLIC_GA_ID 가 있을 때만 (로컬·미리보기 배포는 집계하지 않는다)
export function analyticsId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  return id && process.env.VERCEL_ENV === "production" ? id : null;
}

// GA4. 동의 기본값(EEA·영국·스위스 기본 거부)은 HeadScripts 가 <head> 에서 먼저 넣는다.
// 설정(ga-init)은 하이드레이션 뒤 바로 dataLayer 에 넣고, gtag.js(gzip 175KB)는 페이지를 다 받은 뒤 쉬는 틈에 받는다:
// 그 사이 track() 이벤트도 dataLayer 에 순서대로 쌓였다가 gtag.js 가 오면 함께 보낸다 (gtag 함수는 HeadScripts 가 먼저 만든다)
export function Analytics() {
  const id = analyticsId();
  if (!id) return null;

  const init = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js', new Date());",
    `gtag('config', ${JSON.stringify(id)});`,
  ]
    .join("\n")
    .replace(/</g, "\\u003c");

  return (
    <>
      <Script id="ga-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: init }} />
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="lazyOnload" />
    </>
  );
}
