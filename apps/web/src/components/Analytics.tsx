import Script from "next/script";

// 동의 배너 없이도 법을 지키도록 EEA·영국·스위스는 기본 거부로 시작한다 (Consent Mode v2). 배너는 애드센스를 붙일 때 단다
const CONSENT_REGIONS = [
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA 나머지 + 영국 + 스위스
  "IS", "LI", "NO", "GB", "CH",
];

const CONSENT_KEYS = ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"] as const;

const consent = (value: "granted" | "denied") => Object.fromEntries(CONSENT_KEYS.map((k) => [k, value]));

// GA4. Vercel 운영 배포에서 NEXT_PUBLIC_GA_ID 가 있을 때만 넣는다 (로컬·미리보기 배포는 집계하지 않는다)
export function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID;
  if (!id || process.env.VERCEL_ENV !== "production") return null;

  const init = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    `gtag('consent', 'default', ${JSON.stringify({ ...consent("denied"), region: CONSENT_REGIONS })});`,
    `gtag('consent', 'default', ${JSON.stringify(consent("granted"))});`,
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
