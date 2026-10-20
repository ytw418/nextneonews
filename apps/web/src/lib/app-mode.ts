// 언니노트 앱(mobile/, Expo 웹뷰) 안에서 열렸는지. 서버 컴포넌트(HeadScripts)도 불러오니 React 훅은 lib/use-app-mode.ts 에 둔다. 앱은 웹뷰 UA 끝에 `UnnieNoteApp/<버전>` 을 붙인다.
// 페이지는 정적/ISR 캐시라 서버는 UA 로 나누지 않는다 — 판정은 모두 클라이언트에서 (html[data-app] 은 아래 인라인 스크립트가 켠다).
// 앱에서는 웹 탭바·설치 카드·언어 제안·이메일 칸·댓글·광고를 빼고, 탭 이동은 앱에 메시지로 넘긴다 (docs/decisions/app-2026-10-21.md §5)

const APP_UA = /UnnieNoteApp\/(\d+(?:\.\d+)*)/;

export function isAppUserAgent(userAgent: string): boolean {
  return APP_UA.test(userAgent);
}

// 클라이언트에서만 부른다
export function isApp(): boolean {
  return isAppUserAgent(navigator.userAgent);
}

export type AppTab = "home" | "rankings" | "guide" | "schedule" | "saved";

// 웹이 앱에 보내는 메시지. 저장 목록 동기화는 앱이 주입한 스크립트가 따로 보낸다 (mobile/src/lib/bridge.ts)
export type AppMessage = { type: "tab"; tab: AppTab };

export function postToApp(message: AppMessage): boolean {
  const bridge = (window as Window & { ReactNativeWebView?: { postMessage(data: string): void } }).ReactNativeWebView;
  if (!bridge) return false;
  bridge.postMessage(JSON.stringify(message));
  return true;
}

// <head> 인라인 스크립트 (HeadScripts 맨 끝 — 쿠팡 게이트가 켠 data-coupang 을 끈다). 그리기 전에 돈다.
// 광고: 애드센스 스크립트 줄은 그대로 두고(검토 중) 요청만 멈춘다 — iOS 앱 1판은 광고 없음, Android 는 웹뷰 광고 등록(WebView API for Ads)을 붙인 뒤.
// 분석: GA 는 끄고(ATT·개인정보 라벨) 쿠키 없는 PostHog 만 남긴다
export function appModeScript(gaId: string | null): string {
  return [
    "(function(){",
    `var m=${APP_UA.toString()}.exec(navigator.userAgent);if(!m)return;`,
    "var h=document.documentElement;",
    'h.setAttribute("data-app",/Android/.test(navigator.userAgent)?"android":"ios");',
    'h.setAttribute("data-app-version",m[1]);',
    'h.removeAttribute("data-coupang");',
    "window.adsbygoogle=window.adsbygoogle||[];window.adsbygoogle.pauseAdRequests=1;",
    gaId ? `window[${JSON.stringify(`ga-disable-${gaId}`)}]=true;` : "",
    "})();",
  ].join("");
}
