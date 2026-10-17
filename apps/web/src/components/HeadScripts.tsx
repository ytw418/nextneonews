import { analyticsId } from "@/components/Analytics";
import { adsenseClient, coupangGateScript } from "@/lib/ads";

// 동의 배너 없이도 법을 지키도록 EEA·영국·스위스는 기본 거부로 시작한다 (Consent Mode v2).
// 동의 창은 애드센스 '개인 정보 보호 및 메시지'의 유럽 규정 메시지(구글 CMP)가 띄우고, 고르면 값을 바꾼다
const CONSENT_REGIONS = [
  // EU 27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU",
  "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // EEA 나머지 + 영국 + 스위스
  "IS", "LI", "NO", "GB", "CH",
];

const CONSENT_KEYS = ["analytics_storage", "ad_storage", "ad_user_data", "ad_personalization"] as const;

const consent = (value: "granted" | "denied") => Object.fromEntries(CONSENT_KEYS.map((k) => [k, value]));

const CONSENT_DEFAULT = [
  "window.dataLayer = window.dataLayer || [];",
  "function gtag(){dataLayer.push(arguments);}",
  `gtag('consent', 'default', ${JSON.stringify({ ...consent("denied"), region: CONSENT_REGIONS })});`,
  `gtag('consent', 'default', ${JSON.stringify(consent("granted"))});`,
].join("\n");

// <head> 인라인 스크립트: 동의 기본값(광고나 분석이 켜졌을 때), 쿠팡 배너 표시 여부. 운영 배포에서만.
// 서버 HTML 에 그대로 넣어 그리기 전에 돈다 (next/script 는 클라이언트에서 끼워 넣는다)
export function HeadScripts() {
  const consentDefault = adsenseClient() || analyticsId() ? CONSENT_DEFAULT : null;
  const coupangGate = coupangGateScript();
  return (
    <>
      {consentDefault && <script dangerouslySetInnerHTML={{ __html: consentDefault }} />}
      {coupangGate && <script dangerouslySetInnerHTML={{ __html: coupangGate }} />}
    </>
  );
}

// 애드센스 스크립트 (자동 광고·사이트 소유 확인). 공식 코드 그대로 async 로 넣는다.
// 콘텐츠 화면에만 둔다 (AppHeader 가 그린다): 404 처럼 내용이 없는 화면에는 구글 광고를 내면 안 된다.
// 어디서 그려도 React 가 서버 HTML 의 <head> 로 끌어올리고 하나로 합친다
export function AdsenseScript() {
  const client = adsenseClient();
  if (!client) return null;
  return (
    <script
      async
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
    />
  );
}
