import Script from "next/script";

// GA4 측정 id. Vercel 운영 배포에서 NEXT_PUBLIC_GA_ID 가 있을 때만 (로컬·미리보기 배포는 집계하지 않는다)
export function analyticsId(): string | null {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  return id && process.env.VERCEL_ENV === "production" ? id : null;
}

// GA4. 동의 기본값(EEA·영국·스위스 기본 거부)은 HeadScripts 가 <head> 에서 먼저 넣는다
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
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`} strategy="afterInteractive" />
    </>
  );
}
