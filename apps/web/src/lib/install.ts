import { isAppUserAgent } from "./app-mode";

// 크롬은 서비스 워커가 이미 있는 재방문이면 beforeinstallprompt 를 하이드레이션 전에 보낼 수 있다.
// 그때 놓치지 않게 레이아웃 맨 앞 인라인 스크립트가 먼저 붙잡아 두고(작은 설치 막대도 막고), InstallPrompt 가 나중에 꺼내 쓴다
export const INSTALL_EVENT_KEY = "__hbInstallEvent";
export const INSTALL_CAPTURE_SCRIPT = `addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.${INSTALL_EVENT_KEY}=e})`;

// 앱 안 브라우저: 인스타그램·페이스북·LINE·스레드(Barcelona)·틱톡(BytedanceWebview·musical_ly)·위챗·카카오톡·X·네이버 앱·
// 샤오훙수·구글 앱(GSA). 여기서 저장한 건 사파리와 따로 산다 (저장함 경고, 설치 안내 제외).
// 크롬 iOS·파이어폭스 같은 일반 브라우저는 넣지 않는다 — '이 앱 안 브라우저' 경고가 틀린 말이 된다 (InstallPrompt 가 따로 더한다)
const IN_APP_UA =
  /Instagram|FBAN|FBAV|\bLine\/|Barcelona|BytedanceWebview|musical_ly|MicroMessenger|KAKAOTALK|Twitter|NAVER\(inapp|xhsdiscover|GSA\//;

export function isInAppBrowser(userAgent: string): boolean {
  return IN_APP_UA.test(userAgent);
}

// 홈 화면에 추가한 앱(PWA)으로 열었는지. 클라이언트에서만 부른다
export function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// 분석 이벤트·이메일 칸에 붙이는 열린 곳: 언니노트 앱 웹뷰(app) / 홈 화면 앱(pwa) / 브라우저(web)
export type AppPlatform = "app" | "pwa" | "web";

export function platformOf(userAgent: string, standalone: boolean): AppPlatform {
  return isAppUserAgent(userAgent) ? "app" : standalone ? "pwa" : "web";
}

export function appPlatform(): AppPlatform {
  return platformOf(navigator.userAgent, isStandalone());
}

// 기기 종류. 이메일 칸의 '앱 출시 알림'을 iOS·Android 로 나눠 세려고 서버가 UA 로 고른다 (앱 착수 기준이 iOS 대기 명단)
export type DeviceOs = "ios" | "android" | "other";

export function deviceOs(userAgent: string): DeviceOs {
  if (/iPhone|iPad|iPod/.test(userAgent)) return "ios";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}
